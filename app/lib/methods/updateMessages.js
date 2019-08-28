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
		const allMessages = await sub.messages.fetch();
		const msgCollection = watermelon.collections.get('messages');

		const msgsToUpdate = allMessages.filter(i1 => messages.find(i2 => i1.id === i2._id));
		const msgsToCreate = messages.filter(
			i1 => !allMessages.find(i2 => i1._id === i2.id)
		);

		const allRecords = [
			...msgsToCreate.map(message => msgCollection.prepareCreate((m) => {
				m._raw = sanitizedRaw(
					{
						id: message._id
					},
					msgCollection.schema
				);
				m.subscription.set(sub);
				return assignSub(m, message);
			})),
			...msgsToUpdate.map((message) => {
				const newSub = messages.find(
					m => m._id === message.id
				);
				return message.prepareUpdate(() => {
					message.subscription.set(sub);
					assignSub(message, newSub);
				});
			})
		];

		try {
			await watermelon.batch(...allRecords);
		} catch (e) {
			console.log('TCL: batch watermelon -> e', e);
		}
		return allRecords.length;
	});
}
