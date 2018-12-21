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

export default function() {
	const { database: db } = database;

	return new Promise(async(resolve, reject) => {
		try {
			const updatedSince = lastMessage();
			// subscriptions.get: Since RC 0.60.0
			// rooms.get: Since RC 0.62.0
			const [subscriptionsResult, roomsResult] = await (updatedSince
				? Promise.all([SDK.api.get('subscriptions.get', { updatedSince }), SDK.api.get('rooms.get', { updatedSince })])
				: Promise.all([SDK.api.get('subscriptions.get'), SDK.api.get('rooms.get')])
			);
			const { subscriptions, rooms } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

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
