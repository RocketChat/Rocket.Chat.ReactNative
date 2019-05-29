import { InteractionManager } from 'react-native';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';

const getLastUpdate = (rid) => {
	const sub = database
		.objects('subscriptions')
		.filtered('rid == $0', rid)[0];
	return sub && new Date(sub.lastOpen).toISOString();
};

async function load({ rid: roomId, lastOpen }) {
	let lastUpdate;
	if (lastOpen) {
		lastUpdate = new Date(lastOpen).toISOString();
	} else {
		lastUpdate = getLastUpdate(roomId);
	}
	// RC 0.60.0
	const { result } = await this.sdk.get('chat.syncMessages', { roomId, lastUpdate });
	return result;
}

export default function loadMissedMessages(...args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await load.call(this, ...args));

			if (data) {
				if (data.updated && data.updated.length) {
					const { updated } = data;
					InteractionManager.runAfterInteractions(() => {
						database.write(() => updated.forEach((message) => {
							try {
								message = buildMessage(message);
								database.create('messages', message, true);
								// if it's a thread "header"
								if (message.tlm) {
									database.create('threads', message, true);
								}
								if (message.tmid) {
									message.rid = message.tmid;
									database.create('threadMessages', message, true);
								}
							} catch (e) {
								log('loadMissedMessages -> create messages', e);
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
									const message = database.objects('messages').filtered('_id = $0', m._id);
									database.delete(message);
									const thread = database.objects('threads').filtered('_id = $0', m._id);
									database.delete(thread);
									const threadMessage = database.objects('threadMessages').filtered('_id = $0', m._id);
									database.delete(threadMessage);
								});
							});
						} catch (e) {
							log('loadMissedMessages -> delete message', e);
						}
					});
				}
			}
			resolve();
		} catch (e) {
			log('loadMissedMessages', e);
			reject(e);
		}
	});
}
