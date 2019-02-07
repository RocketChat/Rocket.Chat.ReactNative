import { InteractionManager } from 'react-native';

import mergeSubscriptionsRooms from './helpers/mergeSubscriptionsRooms';
import database from '../realm';
import log from '../../utils/log';

const lastMessage = () => {
	const message = database
		.objects('subscriptions')
		.sorted('roomUpdatedAt', true)[0];
	return message && new Date(message.roomUpdatedAt).toISOString();
};

export default function() {
	return new Promise(async(resolve, reject) => {
		try {
			const updatedSince = lastMessage();
			// subscriptions.get: Since RC 0.60.0
			// rooms.get: Since RC 0.62.0
			const [subscriptionsResult, roomsResult] = await (updatedSince
				? Promise.all([this.sdk.get('subscriptions.get', { updatedSince }), this.sdk.get('rooms.get', { updatedSince })])
				: Promise.all([this.sdk.get('subscriptions.get'), this.sdk.get('rooms.get')])
			);
			const { subscriptions } = mergeSubscriptionsRooms(subscriptionsResult, roomsResult);

			InteractionManager.runAfterInteractions(() => {
				database.write(() => {
					subscriptions.forEach(subscription => database.create('subscriptions', subscription, true));
				});
				resolve(subscriptions);
			});
		} catch (e) {
			log('getRooms', e);
			reject(e);
		}
	});
}
