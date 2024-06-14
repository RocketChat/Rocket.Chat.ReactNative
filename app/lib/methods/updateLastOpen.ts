import database from '../database';
import log from './helpers/log';
import { TSubscriptionModel } from '../../definitions';

export async function updateLastOpen(rid: string, lastOpen = new Date()): Promise<void> {
	try {
		const db = database.active;
		const subscription = await db.get('subscriptions').find(rid);
		await db.write(async () => {
			await subscription.update((s: TSubscriptionModel) => {
				s.lastOpen = lastOpen;
			});
		});
	} catch (e) {
		log(e);
	}
}
