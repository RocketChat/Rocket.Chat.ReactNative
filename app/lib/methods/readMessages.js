import * as SDK from '@rocket.chat/sdk';

import database from '../realm';
import log from '../../utils/log';

const readMessagesREST = function readMessagesREST(rid) {
	return SDK.api.post('subscriptions.read', { rid });
};

const readMessagesDDP = function readMessagesDDP(rid) {
	try {
		return SDK.driver.asyncCall('readMessages', rid);
	} catch (e) {
		return readMessagesREST.call(this, rid);
	}
};

export default async function readMessages(rid) {
	const ls = new Date();
	const { database: db } = database;
	try {
		const data = await (SDK.driver.ddp ? readMessagesDDP.call(this, rid) : readMessagesREST.call(this, rid));
		const [subscription] = db.objects('subscriptions').filtered('rid = $0', rid);
		db.write(() => {
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
