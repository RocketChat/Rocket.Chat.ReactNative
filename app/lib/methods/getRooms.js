import { get } from './helpers/rest';
import database from '../realm';

import mergeSubscriptionsRooms from './helpers/mergeSubscriptionsRooms';

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
	console.log('getRoomRest');
	const updatedSince = lastMessage();
	const { ddp } = this;
	const { token, id } = ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const [subscriptions, rooms] = await Promise.all([get({ token, id, server }, 'subscriptions.get', { updatedSince }), get({ token, id, server }, 'rooms.get', { updatedSince })]);
	return mergeSubscriptionsRooms(subscriptions, rooms);
};

const getRoomDpp = async function() {
	console.log('getRoomDpp');
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
		const { database: db } = database;
		// eslint-disable-next-line
		const data = await (this.ddp._logged ? getRoomDpp.apply(this) : getRoomRest.apply(this));
		db.write(() => {
			data.forEach(subscription => db.create('subscriptions', subscription, true));
		});
		return data;
	} catch (e) {
		alert(e);
	}
}
