import { InteractionManager } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import watermelondb from '../database';

// TODO: move to utils
const assignSub = (sub, newSub) => {
	Object.assign(sub, newSub);
};

export default function updateMessages(rid, messages) {
	const watermelon = watermelondb.database;
	return watermelon.action(async() => {
		const subCollection = watermelon.collections.get('subscriptions');
		const subQuery = await subCollection.query(Q.where('rid', rid)).fetch();
		if (!subQuery) {
			return;
		}
		const sub = subQuery[0];
		const msgCollection = watermelon.collections.get('messages');
		const threadCollection = watermelon.collections.get('threads');
		const threadMessagesCollection = watermelon.collections.get('thread_messages');
		const allMessagesRecords = await sub.messages.fetch();
		const allThreadsRecords = await sub.threads.fetch();
		const allThreadMessagesRecords = await sub.threadMessages.fetch();

		messages = messages.map(m => buildMessage(m));

		// filter messages
		let msgsToCreate = messages.filter(i1 => !allMessagesRecords.find(i2 => i1._id === i2.id));
		let msgsToUpdate = allMessagesRecords.filter(i1 => messages.find(i2 => i1.id === i2._id));

		// filter threads
		const allThreads = messages.filter(m => m.tlm);
		let threadsToCreate = allThreads.filter(i1 => !allThreadsRecords.find(i2 => i1._id === i2.id));
		let threadsToUpdate = allThreadsRecords.filter(i1 => allThreads.find(i2 => i1.id === i2._id));

		// filter thread messages
		const allThreadMessages = messages.filter(m => m.tmid);
		let threadMessagesToCreate = allThreadMessages.filter(i1 => !allThreadMessagesRecords.find(i2 => i1._id === i2.id));
		let threadMessagesToUpdate = allThreadMessagesRecords.filter(i1 => allThreadMessages.find(i2 => i1.id === i2._id));

		// Create
		msgsToCreate = msgsToCreate.map(message => msgCollection.prepareCreate((m) => {
			m._raw = sanitizedRaw({ id: message._id }, msgCollection.schema);
			m.subscription.set(sub);
			assignSub(m, message);
		}));
		threadsToCreate = threadsToCreate.map(thread => threadCollection.prepareCreate((t) => {
			t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
			t.subscription.set(sub);
			assignSub(t, thread);
		}));
		threadMessagesToCreate = threadMessagesToCreate.map(threadMessage => threadMessagesCollection.prepareCreate((tm) => {
			tm._raw = sanitizedRaw({ id: threadMessage._id }, threadMessagesCollection.schema);
			tm.subscription.set(sub);
			assignSub(tm, threadMessage);
			tm.rid = threadMessage.tmid;
		}));

		// Update
		msgsToUpdate = msgsToUpdate.map((message) => {
			const newMessage = messages.find(m => m._id === message.id);
			return message.prepareUpdate(() => {
				message.subscription.set(sub);
				assignSub(message, newMessage);
			});
		});
		threadsToUpdate = threadsToUpdate.map((thread) => {
			const newThread = messages.find(t => t._id === thread.id);
			return thread.prepareUpdate(() => {
				thread.subscription.set(sub);
				assignSub(thread, newThread);
			});
		});
		threadMessagesToUpdate = threadMessagesToUpdate.map((threadMessage) => {
			const newThreadMessage = messages.find(t => t._id === threadMessage.id);
			return threadMessage.prepareUpdate(() => {
				threadMessage.subscription.set(sub);
				assignSub(threadMessage, newThreadMessage);
			});
		});

		const allRecords = [
			...msgsToCreate,
			...msgsToUpdate,
			...threadsToCreate,
			...threadsToUpdate,
			...threadMessagesToCreate,
			...threadMessagesToUpdate
		];

		try {
			await watermelon.batch(...allRecords);
		} catch (e) {
			console.log('TCL: batch watermelon -> e', e);
		}
		return allRecords.length;
	});
}
