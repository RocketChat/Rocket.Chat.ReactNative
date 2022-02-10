import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import database from '../database';
import { Encryption } from '../encryption';
import { MESSAGE_TYPE_ANY_LOAD } from '../../constants/messageTypeLoad';
import { generateLoadMoreId } from '../utils';
import protectedFunction from './helpers/protectedFunction';
import buildMessage from './helpers/buildMessage';
import { IMessage, TMessageModel, TThreadMessageModel, TThreadModel } from '../../definitions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

interface IUpdateMessages {
	rid: string;
	// TODO: It should be the return from the REST API instead of IMessage
	update: IMessage[];
	remove: IMessage[];
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

	const sub = await getSubscriptionByRoomId(rid);
	if (!sub) {
		throw new Error('updateMessages: subscription not found');
	}

	const db = database.active;
	return db.write(async () => {
		// Decrypt these messages
		update = await Encryption.decryptMessages(update);

		const messagesIds: string[] = [...update.map(m => m._id), ...remove.map(m => m._id)];
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

		update = update.map(m => buildMessage(m));

		// filter loaders to delete
		let loadersToDelete: TMessageModel[] = allMessagesRecords.filter(i1 =>
			update.find(i2 => i1.id === generateLoadMoreId(i2._id))
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
					m.subscription.id = sub.id;
					Object.assign(m, message);
				})
			)
		);
		const threadsToCreate = filteredThreadsToCreate.map(thread =>
			threadCollection.prepareCreate(
				protectedFunction((t: TThreadModel) => {
					t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
					t.subscription.id = sub.id;
					Object.assign(t, thread);
				})
			)
		);
		const threadMessagesToCreate = filteredThreadMessagesToCreate.map(threadMessage =>
			threadMessagesCollection.prepareCreate(
				protectedFunction((tm: TThreadMessageModel) => {
					tm._raw = sanitizedRaw({ id: threadMessage._id }, threadMessagesCollection.schema);
					Object.assign(tm, threadMessage);
					tm.subscription.id = sub.id;
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
						Object.assign(m, newMessage);
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
		];

		await db.batch(...allRecords);
		return allRecords.length;
	});
}
