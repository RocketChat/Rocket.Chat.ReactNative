import { ILastMessage } from '../../definitions';
import log from '../../utils/log';
import database from '../database';
import sdk from '../rocketchat/services/sdk';
import updateMessages from './updateMessages';

const getLastUpdate = async (rid: string) => {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const sub = await subsCollection.find(rid);
		return sub.lastOpen?.toISOString();
	} catch (e) {
		// Do nothing
	}
	return null;
};

async function load({ rid: roomId, lastOpen }: { rid: string; lastOpen: Date }) {
	let lastUpdate;
	if (lastOpen) {
		lastUpdate = new Date(lastOpen).toISOString();
	} else {
		lastUpdate = await getLastUpdate(roomId);
	}
	// RC 0.60.0
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, lastUpdate });
	return result;
}

export default function loadMissedMessages(args: { rid: string; lastOpen: Date }): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await load({ rid: args.rid, lastOpen: args.lastOpen });
			if (data) {
				const { updated, deleted }: { updated: ILastMessage[]; deleted: ILastMessage[] } = data;
				// @ts-ignore // TODO: remove loaderItem obligatoriness
				await updateMessages({ rid: args.rid, update: updated, remove: deleted });
			}
			resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
