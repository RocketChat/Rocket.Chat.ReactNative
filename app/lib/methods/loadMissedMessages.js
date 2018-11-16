import { InteractionManager } from 'react-native';
import * as SDK from '@rocket.chat/sdk';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

async function loadMissedMessagesRest({ rid: roomId, lastOpen }) {
	let lastUpdate;
	if (lastOpen) {
		lastUpdate = new Date(lastOpen).toISOString();
	} else {
		return [];
	}
	const { result } = await SDK.api.get('chat.syncMessages', { roomId, lastUpdate, count: 50 });
	return result;
}

async function loadMissedMessagesDDP(...args) {
	const [{ rid, lastOpen: lastUpdate }] = args;

	try {
		const result = await SDK.driver.asyncCall('messages/get', rid, { lastUpdate: new Date(lastUpdate), count: 50 });
		return result;
	} catch (e) {
		return loadMissedMessagesRest.call(this, ...args);
	}
}

export default function loadMissedMessages(...args) {
	const { database: db } = database;
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await (this.connected() ? loadMissedMessagesDDP.call(this, ...args) : loadMissedMessagesRest.call(this, ...args)));

			if (data) {
				if (data.updated && data.updated.length) {
					const { updated } = data;
					updated.forEach(buildMessage);
					InteractionManager.runAfterInteractions(() => {
						db.write(() => updated.forEach(message => db.create('messages', message, true)));
						resolve(updated);
					});
				}
				if (data.deleted && data.deleted.length) {
					const { deleted } = data;
					InteractionManager.runAfterInteractions(() => {
						db.write(() => {
							deleted.forEach((m) => {
								const message = database.objects('messages').filtered('_id = $0', m._id);
								database.delete(message);
							});
						});
					});
				}
			}
			resolve([]);
		} catch (e) {
			log('loadMissedMessages', e);
			reject(e);
		}
	});
}
