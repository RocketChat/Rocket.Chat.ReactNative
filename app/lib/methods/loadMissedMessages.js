import { InteractionManager } from 'react-native';

import database from '../realm';
import log from '../../utils/log';
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

export default function loadMissedMessages(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = (await load.call(this, { rid: args.rid, lastOpen: args.lastOpen }));

			if (data) {
				const { updated, deleted } = data;
				InteractionManager.runAfterInteractions(async() => {
					await updateMessages({ rid: args.rid, update: updated, remove: deleted });
				});
			}
			resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
