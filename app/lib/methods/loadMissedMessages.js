import { InteractionManager } from 'react-native';

import buildMessage from './helpers/buildMessage';
import database from '../realm';
import log from '../../utils/log';
import watermelondb from '../database';
import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import updateMessages from './updateMessages';

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

// TODO: move to utils
const assignSub = (sub, newSub) => {
	Object.assign(sub, newSub);
};

export default function loadMissedMessages(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await load.call(this, { rid: args.rid, lastOpen: args.lastOpen }));

			if (data) {
				if (data.updated && data.updated.length) {
					const { updated } = data;
					InteractionManager.runAfterInteractions(async() => {
						await updateMessages(args.rid, updated);
						// database.write(() => updated.forEach(async(message) => {
						// 	try {
						// 		message = buildMessage(message);
						// 		database.create('messages', message, true);
						// 		// if it's a thread "header"
						// 		if (message.tlm) {
						// 			database.create('threads', message, true);
						// 		}
						// 		if (message.tmid) {
						// 			message.rid = message.tmid;
						// 			database.create('threadMessages', message, true);
						// 		}
						// 	} catch (e) {
						// 		log(e);
						// 	}
						// }));
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
							log(e);
						}
					});
				}
			}
			resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
