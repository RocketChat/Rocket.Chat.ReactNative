import { InteractionManager } from 'react-native';

import { get } from './helpers/rest';
import buildMessage from './helpers/buildMessage';
import database from '../realm';

async function loadMessagesForRoomRest(rid, end) {
	console.log('loadMessagesForRoomRest');

	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const data = await get({ token, id, server }, 'channels.history', { rid, end });
	return data.messages;
}

async function loadMessagesForRoomDDP(rid, end) {
	try {
		console.log('loadMessagesForRoomDDP');
		const data = await this.ddp.call('loadHistory', rid, end, 50);
		if (!data || !data.messages.length) {
			return [];
		}
		return data.messages;
	} catch (e) {
		return loadMessagesForRoomRest.call(this, rid, end);
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
	const data = await (this.ddp._logged ? loadMessagesForRoomDDP.call(this, ...args) : loadMessagesForRoomRest.call(this, ...args));
	if (data) {
		try {
			InteractionManager.runAfterInteractions(() => db.write(() => data.map(buildMessage).forEach(message => db.create('messages', message, true))));
		} catch (e) {
			alert(e);
		}
	}
	return data;
}
