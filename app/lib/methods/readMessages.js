import watermelondb from '../database';
import log from '../../utils/log';

export default async function readMessages(rid, lastOpen) {
	try {
		// RC 0.61.0
		const data = await this.sdk.post('subscriptions.read', { rid });
		const watermelon = watermelondb.database;
		await watermelon.action(async() => {
			try {
				const subscription = await watermelon.collections.get('subscriptions').find(rid);
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
				log(e);
			}
		});
		return data;
	} catch (e) {
		log(e);
	}
}
