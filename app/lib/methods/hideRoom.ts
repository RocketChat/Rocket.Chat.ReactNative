import { type RoomType } from '~/definitions';
import database from '../database';
import log, { events, logEvent } from './helpers/log';
import { hideRoom as hideRoomService } from '../services/restApi';

export const hideRoom = async (rid: string, type: RoomType) => {
	logEvent(events.RL_HIDE_CHANNEL);
	try {
		const db = database.active;
		const result = await hideRoomService(rid, type);
		if (result.success) {
			const subCollection = db.get('subscriptions');
			await db.write(async () => {
				try {
					const subRecord = await subCollection.find(rid);
					await subRecord.destroyPermanently();
				} catch (e) {
					log(e);
				}
			});
		}
	} catch (e) {
		log(e);
	}
};
