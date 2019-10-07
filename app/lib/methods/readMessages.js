import database from '../database';
import log from '../../utils/log';

export default async function readMessages(rid, lastOpen, batch = false, subscription) {
	try {
		// RC 0.61.0
		const data = await this.sdk.post('subscriptions.read', { rid });
		const db = database.active;

		if (!subscription) {
			subscription = await db.collections.get('subscriptions').find(rid);
		}

		if (batch) {
			return subscription.prepareUpdate((s) => {
				s.open = true;
				s.alert = false;
				s.unread = 0;
				s.userMentions = 0;
				s.groupMentions = 0;
				s.ls = lastOpen;
				s.lastOpen = lastOpen;
			});
		} else {
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
			return data;
		}
	} catch (e) {
		log(e);
	}
}
