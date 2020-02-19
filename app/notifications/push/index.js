import EJSON from 'ejson';

import PushNotification from './push';
import store from '../../lib/createStore';
import { deepLinkingOpen } from '../../actions/deepLinking';

export const onNotification = (notification) => {
	if (notification) {
		const data = notification.getData();
		if (data) {
			try {
				const {
					rid, name, sender, type, host
				} = EJSON.parse(data.ejson);

				const types = {
					c: 'channel', d: 'direct', p: 'group', l: 'channels'
				};
				let roomName = type === 'd' ? sender.username : name;
				if (type === 'l') {
					roomName = sender.name;
				}

				const params = {
					host,
					rid,
					path: `${ types[type] }/${ roomName }`
				};
				store.dispatch(deepLinkingOpen(params));
			} catch (e) {
				console.warn(e);
			}
		}
	}
};

export const getDeviceToken = () => PushNotification.getDeviceToken();
export const setBadgeCount = count => PushNotification.setBadgeCount(count);
export const initializePushNotifications = () => {
	setBadgeCount();
	return PushNotification.configure({
		onNotification
	});
};
