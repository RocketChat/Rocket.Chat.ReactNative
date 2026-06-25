import database from '../database';
import log, { events, logEvent } from './helpers/log';
import { toggleFavorite } from '../services/restApi';

export const toggleFav = async (rid: string, favorite: boolean): Promise<void> => {
	logEvent(favorite ? events.RL_UNFAVORITE_CHANNEL : events.RL_FAVORITE_CHANNEL);
	try {
		const db = database.active;
		const result = await toggleFavorite(rid, !favorite);
		if (result.success) {
			const subCollection = db.get('subscriptions');
			await db.write(async () => {
				try {
					const subRecord = await subCollection.find(rid);
					await subRecord.update(sub => {
						sub.f = !favorite;
					});
				} catch (e) {
					log(e);
				}
			});
		}
	} catch (e) {
		log(e);
	}
};
