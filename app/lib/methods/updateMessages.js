import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import buildMessage from './helpers/buildMessage';
import log from '../../utils/log';
import database from '../database';
import protectedFunction from './helpers/protectedFunction';
import { Encryption } from '../encryption';
import { MESSAGE_TYPE_ANY_LOAD } from '../../constants/messageTypeLoad';
import { generateLoadMoreId } from '../utils';

export default function updateMessages({
	rid, update = [], remove = [], loaderItem
}) {
	try {
		if (!((update && update.length) || (remove && remove.length))) {
			return;
		}
		const db = database.active;
		return db.action(async() => {
			// Decrypt these messages
			update = await Encryption.decryptMessages(update);
			const subCollection = db.get('subscriptions');
			let sub;
			try {
				sub = await subCollection.find(rid);
			} catch (error) {
				sub = { id: rid };
				console.log('updateMessages: subscription not found');
			}

			const messagesIds = [...update.map(m => m._id), ...remove.map(m => m._id)];
			const msgCollection = db.get('messages');
			const threadCollection = db.get('threads');
			const threadMessagesCollection = db.get('thread_messages');
			const allMessagesRecords = await msgCollection
				.query(
					Q.where('rid', rid),
					Q.or(
						Q.where('id', Q.oneOf(messagesIds)),
						Q.where('t', Q.oneOf(MESSAGE_TYPE_ANY_LOAD))
					)
				)
				.fetch();
			const allThreadsRecords = await threadCollection
				.query(Q.where('rid', rid), Q.where('id', Q.oneOf(messagesIds)))
				.fetch();
			const allThreadMessagesRecords = await threadMessagesCollection
				.query(Q.where('subscription_id', rid), Q.where('id', Q.oneOf(messagesIds)))
				.fetch();

			update = update.map(m => buildMessage(m));

			// filter messages
			let msgsToCreate = update.filter(i1 => !allMessagesRecords.find(i2 => i1._id === i2.id));
			let msgsToUpdate = allMessagesRecords.filter(i1 => update.find(i2 => i1.id === i2._id));

			// filter threads
			const allThreads = update.filter(m => m.tlm);
			let threadsToCreate = allThreads.filter(i1 => !allThreadsRecords.find(i2 => i1._id === i2.id));
			let threadsToUpdate = allThreadsRecords.filter(i1 => allThreads.find(i2 => i1.id === i2._id));

			// filter thread messages
			const allThreadMessages = update.filter(m => m.tmid);
			let threadMessagesToCreate = allThreadMessages.filter(i1 => !allThreadMessagesRecords.find(i2 => i1._id === i2.id));
			let threadMessagesToUpdate = allThreadMessagesRecords.filter(i1 => allThreadMessages.find(i2 => i1.id === i2._id));

			// filter loaders to delete
			let loadersToDelete = allMessagesRecords.filter(i1 => update.find(i2 => i1.id === generateLoadMoreId(i2._id)));

			// Create
			msgsToCreate = msgsToCreate.map(message => msgCollection.prepareCreate(protectedFunction((m) => {
				m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
				m.subscription.id = sub.id;
				Object.assign(m, message);
			})));
			threadsToCreate = threadsToCreate.map(thread => threadCollection.prepareCreate(protectedFunction((t) => {
				t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
				t.subscription.id = sub.id;
				Object.assign(t, thread);
			})));
			threadMessagesToCreate = threadMessagesToCreate.map(threadMessage => threadMessagesCollection.prepareCreate(protectedFunction((tm) => {
				tm._raw = sanitizedRaw({ id: threadMessage._id }, threadMessagesCollection.schema);
				Object.assign(tm, threadMessage);
				tm.subscription.id = sub.id;
				tm.rid = threadMessage.tmid;
				delete threadMessage.tmid;
			})));

			// Update
			msgsToUpdate = msgsToUpdate.map((message) => {
				const newMessage = update.find(m => m._id === message.id);
				if (message._hasPendingUpdate) {
					console.log(message);
					return;
				}
				return message.prepareUpdate(protectedFunction((m) => {
					Object.assign(m, newMessage);
				}));
			});
			threadsToUpdate = threadsToUpdate.map((thread) => {
				if (thread._hasPendingUpdate) {
					console.log(thread);
					return;
				}
				const newThread = allThreads.find(t => t._id === thread.id);
				return thread.prepareUpdate(protectedFunction((t) => {
					Object.assign(t, newThread);
				}));
			});
			threadMessagesToUpdate = threadMessagesToUpdate.map((threadMessage) => {
				if (threadMessage._hasPendingUpdate) {
					console.log(threadMessage);
					return;
				}
				const newThreadMessage = allThreadMessages.find(t => t._id === threadMessage.id);
				return threadMessage.prepareUpdate(protectedFunction((tm) => {
					Object.assign(tm, newThreadMessage);
					tm.rid = threadMessage.tmid;
					delete threadMessage.tmid;
				}));
			});

			// Delete
			let msgsToDelete = [];
			let threadsToDelete = [];
			let threadMessagesToDelete = [];
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

			const allRecords = [
				...msgsToCreate,
				...msgsToUpdate,
				...msgsToDelete,
				...threadsToCreate,
				...threadsToUpdate,
				...threadsToDelete,
				...threadMessagesToCreate,
				...threadMessagesToUpdate,
				...threadMessagesToDelete,
				...loadersToDelete
			];

			try {
				await db.batch(...allRecords);
			} catch (e) {
				log(e);
			}
			return allRecords.length;
		});
	} catch (e) {
		log(e);
	}
}
