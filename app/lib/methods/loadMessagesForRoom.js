import { InteractionManager } from 'react-native';
import * as SDK from '@rocket.chat/sdk';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

async function load({ rid: roomId, latest, t }) {
	let params = { roomId, count: 50 };
	if (latest) {
		params = { ...params, latest: new Date(latest).toISOString() };
	}
	const data = await SDK.api.get(`${ this.roomTypeToApiType(t) }.history`, params);
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
