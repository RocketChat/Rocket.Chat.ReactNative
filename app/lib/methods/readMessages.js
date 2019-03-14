import database from '../realm';
import log from '../../utils/log';

export default async function readMessages(rid) {
	const ls = new Date();
	try {
		// RC 0.61.0
		const data = await this.sdk.post('subscriptions.read', { rid });
		const [subscription] = database.objects('subscriptions').filtered('rid = $0', rid);
		database.write(() => {
			subscription.open = true;
			subscription.alert = false;
			subscription.unread = 0;
			subscription.userMentions = 0;
			subscription.groupMentions = 0;
			subscription.ls = ls;
			subscription.lastOpen = ls;
		});
		return data;
	} catch (e) {
		log('readMessages', e);
	}
}
