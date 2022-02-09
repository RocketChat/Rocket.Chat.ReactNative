import database from '../database';
import log from '../../utils/log';
import updateMessages from './updateMessages';
import { IRocketChat } from '../../definitions/IRocketChat';
import { ILastMessage } from '../../definitions';

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

async function load(this: IRocketChat, { rid: roomId, lastOpen }: { rid: string; lastOpen: string }) {
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

export default function loadMissedMessages(this: IRocketChat, args: { rid: string; lastOpen: string }): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await load.call(this, { rid: args.rid, lastOpen: args.lastOpen });
			if (data) {
				const { updated, deleted }: { updated: ILastMessage[]; deleted: ILastMessage[] } = data;
				// loaderItem is null only to surpass the obligatoriness of the item in the function, as soon as it is migrated it will not be necessary.
				await updateMessages({ rid: args.rid, update: updated, remove: deleted, loaderItem: null });
			}
			resolve();
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
