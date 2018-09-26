import { post } from './helpers/rest';
import database from '../realm';
import log from '../../utils/log';

const	readMessagesREST = function readMessagesREST(rid) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace(/^ws/, 'http');
	return post({ token, id, server }, 'subscriptions.read', { rid });
};

const readMessagesDDP = function readMessagesDDP(rid) {
	try {
		return this.ddp.call('readMessages', rid);
	} catch (e) {
		return readMessagesREST.call(this, rid);
	}
};

export default async function readMessages(rid) {
	const { database: db } = database;
	try {
		// eslint-disable-next-line
		const data = await (this.ddp.status && false ? readMessagesDDP.call(this, rid) : readMessagesREST.call(this, rid));
		const [subscription] = db.objects('subscriptions').filtered('rid = $0', rid);
		db.write(() => {
			subscription.open = true;
			subscription.alert = false;
			subscription.unread = 0;
			subscription.userMentions = 0;
			subscription.groupMentions = 0;
			subscription.ls = new Date();
			subscription.lastOpen = new Date();
		});
		return data;
	} catch (e) {
		log('readMessages', e);
	}
}
