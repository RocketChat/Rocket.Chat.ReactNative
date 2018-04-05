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
const getRoomDpp = async() => {
	const { ddp } = this;
	const ls = lastMessage();
	const [subscriptions, rooms] = await Promise.all([ddp.call('subscriptions/get', ls), ddp.call('rooms/get', ls)]);
	return mergeSubscriptionsRooms(subscriptions, rooms, ls);
};
const getRoomRest = async() => {
	const ls = lastMessage();
	const { token, id } = this.ddp._login;
	const server = this.ddp.url.replace('ws', 'http');
	const [subscriptions, rooms] = await Promise.all([get({ token, id, server }, 'subscriptions.get', ls), get({ token, id, server }, 'rooms.get', ls)]);
	return mergeSubscriptionsRooms(subscriptions, rooms, ls);
};

export default async function() {
	// eslint-disable-next-line
	const data = await ((false && this.ddp._logged) ? getRoomDpp.apply(this) : getRoomRest.apply(this));
	database.write(() => {
		data.forEach(subscription => database.create('subscriptions', subscription, true));
	});
	return data;
}
