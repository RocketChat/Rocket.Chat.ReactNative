import { post } from './helpers/rest';
import database from '../realm';

const readMessagesDDP = function readMessagesDDP(rid) {
	return this.ddp.call('readMessages', rid);
};

const	readMessagesREST = function readMessagesREST(rid) {
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	return post({ token, id, server }, 'subscriptions.read', { rid });
};

export default async function readMessages(rid) {
	const data = await (this.ddp._logged ? readMessagesDDP.call(this, rid) : readMessagesREST.call(this, rid));
	const [subscription] = database.objects('subscriptions').filtered('rid = $0', rid);
	database.write(() => {
		subscription.open = true;
		subscription.alert = false;
		subscription.unread = 0;
		subscription.userMentions = 0;
		subscription.groupMentions = 0;
		subscription.ls = new Date();
		subscription.lastOpen = new Date();
	});
	return data;
}
