import { get } from './helpers/rest';
import mergeSubscriptionsRooms, { merge } from './helpers/mergeSubscriptionsRooms';
import database from '../realm';

const lastMessage = () => {
	try {
		const message = database
			.objects('subscriptions')
			.sorted('roomUpdatedAt', true)[0];
		return message && new Date(message.roomUpdatedAt);
	} catch (e) {
		return null;
	}
};

const getRoomRest = async function() {
	const { ddp } = this;
	const updatedSince = lastMessage();
	const { token, id } = ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const [subscriptions, rooms] = await Promise.all([get({ token, id, server }, 'subscriptions.get', { updatedSince }), get({ token, id, server }, 'rooms.get', { updatedSince })]);
	return mergeSubscriptionsRooms(subscriptions, rooms);
};

const getRoomDpp = async function() {
	try {
		const { ddp } = this;
		const updatedSince = lastMessage();
		const [subscriptions, rooms] = await Promise.all([ddp.call('subscriptions/get', updatedSince), ddp.call('rooms/get', updatedSince)]);
		return mergeSubscriptionsRooms(subscriptions, rooms);
	} catch (e) {
		return getRoomRest.apply(this);
	}
};

export default async function() {
	try {
		if (!this.ddp._login) {
			return false;
		}
		const { database: db } = database;
		// eslint-disable-next-line
		const {subscriptions, rooms} = await (this.ddp.status ? getRoomDpp.apply(this) : getRoomRest.apply(this));

		const data = rooms.map(room => ({ room, sub: database.objects('subscriptions').filtered('rid == $0', room._id) }));

		db.write(() => {
			subscriptions.forEach(subscription => db.create('subscriptions', subscription, true));
			data.forEach(({ sub, room }) => sub[0] && merge(sub[0], room));
		});

		return true;
	} catch (e) {
		console.warn('getRooms', e);
	}
}
