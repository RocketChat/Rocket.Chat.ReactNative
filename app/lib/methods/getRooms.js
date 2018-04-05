import { get } from './helpers/rest';
import database from '../realm';
import reduxStore from '../createStore';

import normalizeMessage from './helpers/normalizeMessage';
import mergeSubscriptionsRooms from './helpers/mergeSubscriptionsRooms';

const lastMessage = function() {
	try {
		const lastMessage = database
			.objects('subscriptions')
			.sorted('roomUpdatedAt', true)[0];
		return lastMessage && new Date(lastMessage.roomUpdatedAt);
	} catch (e) {
		return null;
	}
};
const getRoomDpp = async function() {
	const { ddp } = this;
	const ls = lastMessage();
	const [subscriptions, rooms] = await Promise.all([ddp.call('subscriptions/get', ls), ddp.call('rooms/get', ls)]);
	return mergeSubscriptionsRooms(subscriptions, rooms, ls);
};
const getRoomRest = async function() {
	const ls = lastMessage();
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const [subscriptions, rooms] = await Promise.all([get({ token, id, server }, 'subscriptions.get', ls), get({ token, id, server }, 'rooms.get', ls)]);
	return mergeSubscriptionsRooms(subscriptions, rooms, ls);
};

export default async function() {
	const data = await (this.ddp._logged ? getRoomDpp.apply(this) : getRoomRest.apply(this));
	database.write(() => {
		data.forEach(subscription => database.create('subscriptions', subscription, true));
	});
	return data;
}
