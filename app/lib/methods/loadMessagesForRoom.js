import { InteractionManager } from 'react-native';
import * as SDK from '@rocket.chat/sdk';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

// TODO: api fix
const types = {
	c: 'channels', d: 'im', p: 'groups'
};

async function load({ rid: roomId, latest, t }) {
	if (latest) {
		latest = new Date(latest).toISOString();
	}
	const data = await SDK.api.get(`${ types[t] }.history`, { roomId, latest, count: 50 });
	if (!data || data.status === 'error') {
		return [];
	}
	return data.messages;
}

export default function loadMessagesForRoom(...args) {
	const { database: db } = database;
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, ...args);

			if (data && data.length) {
				InteractionManager.runAfterInteractions(() => {
					db.write(() => data.forEach((message) => {
						db.create('messages', buildMessage(message), true);
					}));
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
