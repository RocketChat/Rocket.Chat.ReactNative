import database from '../database';
import log from './helpers/log';
import { TSubscriptionModel } from '../../definitions';
import sdk from '../services/sdk';

export async function readMessages(rid: string, ls: Date, updateLastOpen = false): Promise<void> {
	try {
		const db = database.active;
		const subscription = await db.get('subscriptions').find(rid);

		// RC 0.61.0
		// @ts-ignore
		await sdk.post('subscriptions.read', { rid });

		await db.write(async () => {
			try {
				await subscription.update((s: TSubscriptionModel) => {
					s.open = true;
					s.alert = false;
					s.unread = 0;
					s.userMentions = 0;
					s.groupMentions = 0;
					s.ls = ls;
					if (updateLastOpen) {
						s.lastOpen = ls;
					}
				});
			} catch (e) {
				// Do nothing
			}
		});
	} catch (e) {
		log(e);
	}
}
