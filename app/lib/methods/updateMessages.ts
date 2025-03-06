import { Model, Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { MESSAGE_TYPE_ANY_LOAD } from '../constants';
import { IMessage, TMessageModel, TSubscriptionModel, TThreadMessageModel, TThreadModel } from '../../definitions';
import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { Encryption } from '../encryption';
import buildMessage from './helpers/buildMessage';
import { generateLoadMoreId } from './helpers/generateLoadMoreId';
import protectedFunction from './helpers/protectedFunction';

interface IUpdateMessages {
	rid: string;
	update: Partial<IMessage>[];
	remove?: Partial<IMessage>[];
	loaderItem?: TMessageModel;
}

export default async function updateMessages({
	rid,
	update = [],
	remove = [],
	loaderItem
}: IUpdateMessages): Promise<number | void> {
	if (!((update && update.length) || (remove && remove.length))) {
		return Promise.resolve(0);
	}

	let sub = (await getSubscriptionByRoomId(rid)) as TSubscriptionModel;
	if (!sub) {
		sub = { id: rid } as any;
		// TODO: If I didn't join the room I obviously don't have a subscription, this error catch is imperfect. Think of a way to handle the error when I actually try to open a room without subscription.
		console.log('updateMessages: subscription not found');
	}

	const db = database.active;
	return db.write(async () => {
		// Decrypt these messages
		update = await Encryption.decryptMessages(update);

		const messagesIds: string[] = [...update.map(m => m._id as string), ...remove.map(m => m._id as string)];
		const msgCollection = db.get('messages');
		const threadCollection = db.get('threads');
		const threadMessagesCollection = db.get('thread_messages');
		const allMessagesRecords = await msgCollection
			.query(Q.where('rid', rid), Q.or(Q.where('id', Q.oneOf(messagesIds)), Q.where('t', Q.oneOf(MESSAGE_TYPE_ANY_LOAD))))
			.fetch();
		const allThreadsRecords = await threadCollection.query(Q.where('rid', rid), Q.where('id', Q.oneOf(messagesIds))).fetch();
		const allThreadMessagesRecords = await threadMessagesCollection
			.query(Q.where('subscription_id', rid), Q.where('id', Q.oneOf(messagesIds)))
			.fetch();

		update = update.map(m => buildMessage(m)) as IMessage[];

		// filter loaders to delete
		let loadersToDelete: TMessageModel[] = allMessagesRecords.filter(i1 =>
			update.find(i2 => i1.id === generateLoadMoreId(i2._id as string))
		);

		// Delete
		let msgsToDelete: TMessageModel[] = [];
		let threadsToDelete: TThreadModel[] = [];
		let threadMessagesToDelete: TThreadMessageModel[] = [];
		if (remove && remove.length) {
			msgsToDelete = allMessagesRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
			msgsToDelete = msgsToDelete.map(m => m.prepareDestroyPermanently());
			threadsToDelete = allThreadsRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
			threadsToDelete = threadsToDelete.map(t => t.prepareDestroyPermanently());
			threadMessagesToDelete = allThreadMessagesRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
			threadMessagesToDelete = threadMessagesToDelete.map(tm => tm.prepareDestroyPermanently());
		}

		// Delete loaders
		loadersToDelete = loadersToDelete.map(m => m.prepareDestroyPermanently());
		if (loaderItem) {
			loadersToDelete.push(loaderItem.prepareDestroyPermanently());
		}

		// filter messages
		const filteredMsgsToCreate = update.filter(i1 => !allMessagesRecords.find(i2 => i1._id === i2.id));
		const filteredMsgsToUpdate = allMessagesRecords.filter(i1 => update.find(i2 => i1.id === i2._id));

		// filter threads
		const allThreads = update.filter(m => m.tlm);
		const filteredThreadsToCreate = allThreads.filter(i1 => !allThreadsRecords.find(i2 => i1._id === i2.id));
		const filteredThreadsToUpdate = allThreadsRecords.filter(i1 => allThreads.find(i2 => i1.id === i2._id));

		// filter thread messages
		const allThreadMessages = update.filter(m => m.tmid);
		const filteredThreadMessagesToCreate = allThreadMessages.filter(i1 => !allThreadMessagesRecords.find(i2 => i1._id === i2.id));
		const filteredThreadMessagesToUpdate = allThreadMessagesRecords.filter(i1 => allThreadMessages.find(i2 => i1.id === i2._id));

		// Create
		const msgsToCreate = filteredMsgsToCreate.map(message =>
			msgCollection.prepareCreate(
				protectedFunction((m: TMessageModel) => {
					m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
					if (m.subscription) {
						m.subscription.id = sub.id;
					}
					Object.assign(m, message);
				})
			)
		);
		const threadsToCreate = filteredThreadsToCreate.map(thread =>
			threadCollection.prepareCreate(
				protectedFunction((t: TThreadModel) => {
					t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
					if (t.subscription) {
						t.subscription.id = sub.id;
					}
					Object.assign(t, thread);
				})
			)
		);
		const threadMessagesToCreate = filteredThreadMessagesToCreate.map(threadMessage =>
			threadMessagesCollection.prepareCreate(
				protectedFunction((tm: TThreadMessageModel) => {
					tm._raw = sanitizedRaw({ id: threadMessage._id }, threadMessagesCollection.schema);
					Object.assign(tm, threadMessage);
					if (tm.subscription) {
						tm.subscription.id = sub.id;
					}
					if (threadMessage.tmid) {
						tm.rid = threadMessage.tmid;
					}
					delete threadMessage.tmid;
				})
			)
		);

		// Update
		const msgsToUpdate = filteredMsgsToUpdate.map(message => {
			const newMessage = update.find(m => m._id === message.id);
			try {
				return message.prepareUpdate(
					protectedFunction((m: TMessageModel) => {
						const { attachments } = m;
						if (newMessage && !newMessage?.blocks) {
							newMessage.blocks = null;
						}
						if (newMessage && !newMessage?.md) {
							newMessage.md = undefined;
						}
						Object.assign(m, newMessage);

						// If image_url didn't change, keep the same attachments, trying to stick to already downloaded media inside att.title_link (starting with file://)
						if (attachments?.[0]?.image_url === newMessage?.attachments?.[0]?.image_url) {
							m.attachments = attachments;
						}
					})
				);
			} catch {
				return null;
			}
		});
		const threadsToUpdate = filteredThreadsToUpdate.map(thread => {
			const newThread = allThreads.find(t => t._id === thread.id);
			try {
				return thread.prepareUpdate(
					protectedFunction((t: TThreadModel) => {
						Object.assign(t, newThread);
					})
				);
			} catch {
				return null;
			}
		});
		const threadMessagesToUpdate = filteredThreadMessagesToUpdate.map(threadMessage => {
			const newThreadMessage = allThreadMessages.find(t => t._id === threadMessage.id);
			try {
				return threadMessage.prepareUpdate(
					protectedFunction((tm: TThreadMessageModel) => {
						if (newThreadMessage && !newThreadMessage?.blocks) {
							newThreadMessage.blocks = null;
						}
						Object.assign(tm, newThreadMessage);
						if (threadMessage.tmid) {
							tm.rid = threadMessage.tmid;
						}
						delete threadMessage.tmid;
					})
				);
			} catch {
				return null;
			}
		});

		const allRecords = [
			...msgsToDelete,
			...threadsToDelete,
			...threadMessagesToDelete,
			...loadersToDelete,
			...msgsToCreate,
			...msgsToUpdate,
			...threadsToCreate,
			...threadsToUpdate,
			...threadMessagesToCreate,
			...threadMessagesToUpdate
		] as Model[];

		await db.batch(allRecords);
		return allRecords.length;
	});
}
