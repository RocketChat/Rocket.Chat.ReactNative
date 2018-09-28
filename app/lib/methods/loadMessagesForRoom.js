import { InteractionManager } from 'react-native';

import { get } from './helpers/rest';
import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import store from '../createStore';

// TODO: api fix
const types = {
	c: 'channels', d: 'im', p: 'groups'
};

async function loadMessagesForRoomRest({ rid: roomId, latest, t }) {
	const { user } = store.getState().login;
	const { token, id } = user;
	const server = this.ddp.url.replace(/^ws/, 'http');
	const data = await get({ token, id, server }, `${ types[t] }.history`, { roomId, latest });
	if (!data || data.status === 'error') {
		return [];
	}
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
}

export default async function loadMessagesForRoom(...args) {
	const { database: db } = database;
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await (this.ddp && this.ddp.status ? loadMessagesForRoomDDP.call(this, ...args) : loadMessagesForRoomRest.call(this, ...args))).map(buildMessage);

			if (data && data.length) {
				InteractionManager.runAfterInteractions(() => {
					db.write(() => data.forEach(message => db.create('messages', message, true)));
					return resolve(data);
				});
			} else {
				return resolve([]);
			}
		} catch (e) {
			log('loadMessagesForRoom', e);
			reject(e);
		}
	});
}
