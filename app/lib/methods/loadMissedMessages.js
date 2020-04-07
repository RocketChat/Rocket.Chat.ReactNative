import database from '../database';
import log from '../../utils/log';
import updateMessages from './updateMessages';

const getLastUpdate = async(rid) => {
	try {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const sub = await subsCollection.find(rid);
		return sub.lastOpen.toISOString();
	} catch (e) {
		// Do nothing
	}
	return null;
};

async function load({ rid: roomId, lastOpen }) {
	let lastUpdate;
	if (lastOpen) {
		lastUpdate = new Date(lastOpen).toISOString();
	} else {
		lastUpdate = await getLastUpdate(roomId);
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
				await updateMessages({ rid: args.rid, update: updated, remove: deleted });
			}
			resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
