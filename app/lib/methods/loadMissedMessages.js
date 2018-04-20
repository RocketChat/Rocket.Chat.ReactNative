import { InteractionManager } from 'react-native';

import { get } from './helpers/rest';
import buildMessage from './helpers/buildMessage';
import database from '../realm';


async function loadMissedMessagesRest({ rid: roomId, lastOpen: lastUpdate }) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const { result } = await get({ token, id, server }, 'chat.syncMessages', { roomId, lastUpdate });
	// TODO: api fix
	return result.updated || result.messages;
}

async function loadMissedMessagesDDP(...args) {
	const [{ rid, lastOpen: lastUpdate }] = args;

	try {
		const data = await this.ddp.call('messages/get', rid, { lastUpdate: new Date(lastUpdate) });
		return data.updated || data.messages;
	} catch (e) {
		return loadMissedMessagesRest.call(this, ...args);
	}

	// }
	// 	if (cb) {
	// 		cb({ end: data && data.messages.length < 20 });
	// 	}
	// 	return data.message;
	// }, (err) => {
	// 	if (err) {
	// 		if (cb) {
	// 			cb({ end: true });
	// 		}
	// 		return Promise.reject(err);
	// 	}
	// });
}

export default async function(...args) {
	const { database: db } = database;
	return new Promise(async(resolve) => {
		// eslint-disable-next-line
		const data = (await (false && this.ddp.status ? loadMissedMessagesDDP.call(this, ...args) : loadMissedMessagesRest.call(this, ...args)));

		if (data) {
			data.forEach(buildMessage);
			return InteractionManager.runAfterInteractions(() => {
				try {
					db.write(() => data.forEach(message => db.create('messages', message, true)));
					resolve(data);
				} catch (e) {
					console.warn('loadMessagesForRoom', e);
				}
			});
		}
		resolve([]);
	});
}
