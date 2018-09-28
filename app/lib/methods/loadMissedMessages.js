import { InteractionManager } from 'react-native';

import { get } from './helpers/rest';
import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import store from '../createStore';

async function loadMissedMessagesRest({ rid: roomId, lastOpen: lastUpdate }) {
	const { user } = store.getState().login;
	const { token, id } = user;
	const server = this.ddp.url.replace(/^ws/, 'http');
	const { result } = await get({ token, id, server }, 'chat.syncMessages', { roomId, lastUpdate });
	return result;
}

async function loadMissedMessagesDDP(...args) {
	const [{ rid, lastOpen: lastUpdate }] = args;

	try {
		const result = await this.ddp.call('messages/get', rid, { lastUpdate: new Date(lastUpdate) });
		return result;
	} catch (e) {
		return loadMissedMessagesRest.call(this, ...args);
	}
}

export default async function loadMissedMessages(...args) {
	const { database: db } = database;
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await (this.ddp && this.ddp.status ? loadMissedMessagesDDP.call(this, ...args) : loadMissedMessagesRest.call(this, ...args)));

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
