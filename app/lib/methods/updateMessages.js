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
		const allMessagesRecords = await sub.messages.fetch();
		const allThreadsRecords = await sub.threads.fetch();
		// const allThreadMessages = await sub.threads.fetch();
		const msgCollection = watermelon.collections.get('messages');
		const threadCollection = watermelon.collections.get('threads');
		// const msgCollection = watermelon.collections.get('messages');

		let msgsToCreate = messages.filter(i1 => !allMessagesRecords.find(i2 => i1._id === i2.id));
		let msgsToUpdate = allMessagesRecords.filter(i1 => messages.find(i2 => i1.id === i2._id));
		const allThreads = messages.filter(m => m.tlm);
		let threadsToCreate = allThreads.filter(i1 => !allThreadsRecords.find(i2 => i1._id === i2.id));
		let threadsToUpdate = allThreadsRecords.filter(i1 => allThreads.find(i2 => i1.id === i2._id));

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

		const allRecords = [
			...msgsToCreate,
			...threadsToCreate,
			...msgsToUpdate,
			...threadsToUpdate
		];

		try {
			await watermelon.batch(...allRecords);
		} catch (e) {
			console.log('TCL: batch watermelon -> e', e);
		}
		return allRecords.length;
	});
}
