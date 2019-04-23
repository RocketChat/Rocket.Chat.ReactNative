import { InteractionManager } from 'react-native';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

async function load({ tmid, lastOpen }) {
	let updatedSince;
	if (lastOpen) {
		updatedSince = new Date(lastOpen).toISOString();
	}
	// RC 1.0
	const { result } = await this.sdk.get('chat.syncThreadMessages', { tmid, updatedSince });
	return result;
}

export default function loadMissedThreadMessages({ tmid, lastOpen }) {
	return new Promise(async(resolve, reject) => {
		if (!lastOpen) {
			return reject();
		}
		try {
			const data = (await load.call(this, { tmid, lastOpen }));

			if (data) {
				if (data.updated && data.updated.length) {
					const { updated } = data;
					InteractionManager.runAfterInteractions(() => {
						database.write(() => updated.forEach((message) => {
							try {
								message = buildMessage(message);
								// if it's a thread "header"
								if (message.tlm) {
									database.create('threads', message, true);
								}
								if (message.tmid) {
									message.rid = message.tmid;
									database.create('threadMessages', message, true);
								}
							} catch (e) {
								log('loadMissedThreadMessages -> create messages', e);
							}
						}));
					});
				}
				if (data.deleted && data.deleted.length) {
					const { deleted } = data;
					InteractionManager.runAfterInteractions(() => {
						try {
							database.write(() => {
								deleted.forEach((m) => {
									const thread = database.objects('threads').filtered('_id = $0', m._id);
									database.delete(thread);
									const threadMessage = database.objects('threadMessages').filtered('_id = $0', m._id);
									database.delete(threadMessage);
								});
							});
						} catch (e) {
							log('loadMissedThreadMessages -> delete message', e);
						}
					});
				}
			}
			resolve();
		} catch (e) {
			log('loadMissedThreadMessages', e);
			reject(e);
		}
	});
}
