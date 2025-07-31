import { SubscriptionType } from '../../definitions';
import database from '../database';
import log, { events, logEvent } from './helpers/log';
import { Services } from '../services';
import { RoomTypes } from './roomTypeToApiType';

export const hideRoom = async (rid: string, type: SubscriptionType) => {
	logEvent(events.RL_HIDE_CHANNEL);
	try {
		const db = database.active;
		const result = await Services.hideRoom(rid, type as RoomTypes);
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
