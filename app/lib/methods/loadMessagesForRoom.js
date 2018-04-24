import { InteractionManager } from 'react-native';

import { get } from './helpers/rest';
import buildMessage from './helpers/buildMessage';
import database from '../realm';


// TODO: api fix
const types = {
	c: 'channels', d: 'im', p: 'groups'
};

async function loadMessagesForRoomRest({ rid: roomId, latest, t }) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const data = await get({ token, id, server }, `${ types[t] }.history`, { roomId, latest });
	return data.messages;
}

async function loadMessagesForRoomDDP(...args) {
	const [{ rid: roomId, latest }] = args;
	try {
		const data = await this.ddp.call('loadHistory', roomId, latest, 50);
		if (!data || !data.messages.length) {
			return [];
		}
		return data.messages;
	} catch (e) {
		console.warn('loadMessagesForRoomDDP', e);
		return loadMessagesForRoomRest.call(this, ...args);
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

export default async function loadMessagesForRoom(...args) {
	console.log('aqui');
	const { database: db } = database;
	console.log('database', db);

	return new Promise(async(resolve) => {
		// eslint-disable-next-line
		const data = (await (false && this.ddp.status ? loadMessagesForRoomDDP.call(this, ...args) : loadMessagesForRoomRest.call(this, ...args))).map(buildMessage);
		if (data) {
			InteractionManager.runAfterInteractions(() => {
				try {
					db.write(() => data.forEach(message => db.create('messages', message, true)));
					resolve(data);
				} catch (e) {
					console.warn('loadMessagesForRoom', e);
				}
			});
		}
		return resolve([]);
	});
}
