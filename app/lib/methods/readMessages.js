import database from '../database';
import log from '../../utils/log';

export default async function readMessages(rid, lastOpen) {
	try {
		const db = database.active;
		const subscription = await db.collections.get('subscriptions').find(rid);

		// RC 0.61.0
		await this.sdk.post('subscriptions.read', { rid });

		await db.action(async() => {
			try {
				await subscription.update((s) => {
					s.open = true;
					s.alert = false;
					s.unread = 0;
					s.userMentions = 0;
					s.groupMentions = 0;
					s.ls = lastOpen;
					s.lastOpen = lastOpen;
				});
			} catch (e) {
				// Do nothing
			}
		});
	} catch (e) {
		log(e);
	}
}
