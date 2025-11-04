import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';
import { type TSubscriptionModel } from '../../definitions';

export async function updateLastOpen(rid: string, lastOpen = new Date()): Promise<void> {
	try {
		const db = database.active;
		const subscription = await getSubscriptionByRoomId(rid);
		if (!subscription) {
			return;
		}
		await db.write(async () => {
			await subscription.update((s: TSubscriptionModel) => {
				s.lastOpen = lastOpen;
			});
		});
	} catch (e) {
		log(e);
	}
}
