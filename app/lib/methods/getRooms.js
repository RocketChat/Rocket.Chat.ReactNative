import { InteractionManager } from 'react-native';

// import { showToast } from '../../utils/info';
import { get } from './helpers/rest';
import mergeSubscriptionsRooms, { merge } from './helpers/mergeSubscriptionsRooms';
import database from '../realm';
import log from '../../utils/log';
import store from '../createStore';

const lastMessage = () => {
	const message = database
		.objects('subscriptions')
		.sorted('roomUpdatedAt', true)[0];
	return message && new Date(message.roomUpdatedAt);
};

const getRoomRest = async function() {
	const updatedSince = lastMessage();
	const { user } = store.getState().login;
	const { token, id } = user;
	const server = this.ddp.url.replace(/^ws/, 'http');
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
	const { database: db } = database;

	return new Promise(async(resolve, reject) => {
		try {
			// eslint-disable-next-line
			const { subscriptions, rooms } = await (this.ddp && this.ddp.status ? getRoomDpp.apply(this) : getRoomRest.apply(this));

			const data = rooms.map(room => ({ room, sub: database.objects('subscriptions').filtered('rid == $0', room._id) }));

			InteractionManager.runAfterInteractions(() => {
				db.write(() => {
					subscriptions.forEach(subscription => db.create('subscriptions', subscription, true));
					data.forEach(({ sub, room }) => sub[0] && merge(sub[0], room));
				});
				resolve(data);
			});
		} catch (e) {
			log('getRooms', e);
			reject(e);
		}
	});
}
