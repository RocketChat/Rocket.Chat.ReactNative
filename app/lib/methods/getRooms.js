import { InteractionManager } from 'react-native';
import * as SDK from '@rocket.chat/sdk';

import mergeSubscriptionsRooms, { merge } from './helpers/mergeSubscriptionsRooms';
import database from '../realm';
import log from '../../utils/log';

const lastMessage = () => {
	const message = database
		.objects('subscriptions')
		.sorted('roomUpdatedAt', true)[0];
	return message && new Date(message.roomUpdatedAt).toISOString();
};

const getRoomRest = async function() {
	const updatedSince = lastMessage();
	const [subscriptions, rooms] = await (updatedSince
		? Promise.all([SDK.api.get('subscriptions.get', { updatedSince }), SDK.api.get('rooms.get', { updatedSince })])
		: Promise.all([SDK.api.get('subscriptions.get'), SDK.api.get('rooms.get')])
	);
	return mergeSubscriptionsRooms(subscriptions, rooms);
};

const getRoomDpp = async function() {
	try {
		const updatedSince = lastMessage();
		const [subscriptions, rooms] = await Promise.all([SDK.driver.asyncCall('subscriptions/get', updatedSince), SDK.driver.asyncCall('rooms/get', updatedSince)]);
		return mergeSubscriptionsRooms(subscriptions, rooms);
	} catch (e) {
		return getRoomRest.apply(this);
	}
};

export default function() {
	const { database: db } = database;

	return new Promise(async(resolve, reject) => {
		try {
			const { subscriptions, rooms } = await (SDK.driver.ddp ? getRoomDpp.apply(this) : getRoomRest.apply(this));

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
