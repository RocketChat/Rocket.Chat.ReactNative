import { InteractionManager } from 'react-native';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import watermelondb from '../database';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

const getLastUpdate = (rid) => {
	const sub = database
		.objects('subscriptions')
		.filtered('rid == $0', rid)[0];
	return sub && new Date(sub.lastOpen).toISOString();
};

async function load({ rid: roomId, lastOpen }) {
	let lastUpdate;
	if (lastOpen) {
		lastUpdate = new Date(lastOpen).toISOString();
	} else {
		lastUpdate = getLastUpdate(roomId);
	}
	// RC 0.60.0
	const { result } = await this.sdk.get('chat.syncMessages', { roomId, lastUpdate });
	return result;
}

// TODO: move to utils
const assignSub = (sub, newSub) => {
	Object.assign(sub, newSub);
};

export default function loadMissedMessages(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await load.call(this, { rid: args.rid, lastOpen: args.lastOpen }));

			if (data) {
				if (data.updated && data.updated.length) {
					const { updated } = data;
					InteractionManager.runAfterInteractions(async() => {
						database.write(() => updated.forEach((message) => {
							try {
								message = buildMessage(message);
								database.create('messages', message, true);
								// if it's a thread "header"
								if (message.tlm) {
									database.create('threads', message, true);
								}
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
							const allMessages = await sub.messages.fetch();
							const msgCollection = watermelon.collections.get('messages');

							const msgsToUpdate = allMessages.filter(i1 => updated.find(i2 => i1.id === i2._id));
							const msgsToCreate = updated.filter(
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
					});
				}
				if (data.deleted && data.deleted.length) {
					const { deleted } = data;
					InteractionManager.runAfterInteractions(() => {
						try {
							database.write(() => {
								deleted.forEach((m) => {
									const message = database.objects('messages').filtered('_id = $0', m._id);
									database.delete(message);
									const thread = database.objects('threads').filtered('_id = $0', m._id);
									database.delete(thread);
									const threadMessage = database.objects('threadMessages').filtered('_id = $0', m._id);
									database.delete(threadMessage);
								});
							});
						} catch (e) {
							log(e);
						}
					});
				}
			}
			resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
