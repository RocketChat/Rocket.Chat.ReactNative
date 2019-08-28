import { InteractionManager } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import watermelondb from '../database';
import { Q } from '@nozbe/watermelondb';

// TODO: move to utils
const assignSub = (sub, newSub) => {
	Object.assign(sub, newSub);
};

async function load({ rid: roomId, latest, t }) {
	if (t === 'l') {
		try {
			// RC 0.51.0
			const data = await this.sdk.methodCall('loadHistory', roomId, null, 50, latest);
			if (!data || data.status === 'error') {
				return [];
			}
			return data.messages;
		} catch (e) {
			log(e);
			return [];
		}
	}

	let params = { roomId, count: 50 };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}
	// RC 0.48.0
	const data = await this.sdk.get(`${ this.roomTypeToApiType(t) }.history`, params);
	if (!data || data.status === 'error') {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, { ...args });

			if (data && data.length) {
				InteractionManager.runAfterInteractions(async() => {
					database.write(() => data.forEach((message) => {
						message = buildMessage(message);
						try {
							database.create('messages', message, true);
							// if it's a thread "header"
							if (message.tlm) {
								database.create('threads', message, true);
							}
							// if it belongs to a thread
							if (message.tmid) {
								message.rid = message.tmid;
								database.create('threadMessages', message, true);
							}
						} catch (e) {
							log(e);
						}
					}));

					const watermelon = watermelondb.database;
					await watermelon.action(async() => {
						const subCollection = watermelon.collections.get('subscriptions');
						const subQuery = await subCollection.query(Q.where('rid', args.rid)).fetch();
						if (!subQuery) {
							return;
						}
						const sub = subQuery[0];
						const msgCollection = watermelon.collections.get('messages');

						const allMessages = await sub.messages.fetch();
						const msgsToUpdate = allMessages.filter(i1 => data.find(i2 => i1.id === i2._id));
						const msgsToCreate = data.filter(
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
								assignSub(m, message);
							})),
							...msgsToUpdate.map((message) => {
								const newSub = data.find(
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

					return resolve(data);
				});
			} else {
				return resolve([]);
			}
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
