import { InteractionManager } from 'react-native';
import EJSON from 'ejson';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

async function load({ tmid, offset }) {
	try {
		// RC 1.0
		const result = await this.sdk.get('chat.getThreadMessages', {
			tmid, count: 50, offset, sort: { ts: -1 }, query: { _hidden: { $ne: true } }
		});
		if (!result || !result.success) {
			return [];
		}
		return result.messages;
	} catch (error) {
		console.log(error);
		return [];
	}
}

export default function loadThreadMessages({ tmid, offset = 0 }) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, { tmid, offset });

			if (data && data.length) {
				InteractionManager.runAfterInteractions(() => {
					database.write(() => data.forEach((m) => {
						try {
							const message = buildMessage(EJSON.fromJSONValue(m));
							message.rid = tmid;
							database.create('threadMessages', message, true);
						} catch (e) {
							log('loadThreadMessages -> create messages', e);
						}
					}));
					return resolve(data);
				});
			} else {
				return resolve([]);
			}
		} catch (e) {
			log('loadThreadMessages', e);
			reject(e);
		}
	});
}
