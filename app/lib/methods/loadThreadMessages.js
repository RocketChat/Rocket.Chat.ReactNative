import { InteractionManager } from 'react-native';
import EJSON from 'ejson';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

async function load({ tmid, skip }) {
	try {
		// RC 1.0
		const data = await this.sdk.methodCall('getThreadMessages', { tmid, limit: 50, skip });
		if (!data || data.status === 'error') {
			return [];
		}
		return data;
	} catch (error) {
		console.log(error);
		return [];
	}
}

export default function loadThreadMessages({ tmid, skip }) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await load.call(this, { tmid, skip });

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
