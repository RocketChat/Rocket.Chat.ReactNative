import { InteractionManager } from 'react-native';

import { get } from './helpers/rest';
import buildMessage from './helpers/buildMessage';
import database from '../realm';


async function loadMissedMessagesRest({ rid: roomId, lastOpen: lastUpdate }) {
	console.log(lastUpdate);
	try {
		const { token, id } = this.ddp._login;
		const server = this.ddp.url.replace('ws', 'http');
		const { result } = await get({ token, id, server }, 'chat.syncMessages', { roomId, lastUpdate });
		// TODO: api fix
		return result.updated;
	} catch (e) {
		console.log(e);
	}
}

async function loadMissedMessagesDDP(...args) {
	const [{ rid, lastOpen: lastUpdate }] = args;
	console.log(lastUpdate);
	try {
		const data = await this.ddp.call('messages/get', rid, { lastUpdate: new Date(lastUpdate) });
		return data.updated;
	} catch (e) {
		alert(e);
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
	const data = (await (this.ddp.status ? loadMissedMessagesDDP.call(this, ...args) : loadMissedMessagesRest.call(this, ...args)));
	if (data) {
		try {
			InteractionManager.runAfterInteractions(() => {
				const messages = data.map(buildMessage);
				db.write(() => messages.forEach(message => db.create('messages', message, true)));
			});
		} catch (e) {
			alert(e);
		}
	}
	return data;
}
