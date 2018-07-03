import EJSON from 'ejson';

import PushNotification from './push';
import store from '../lib/createStore';
import { deepLinkingOpen } from '../actions/deepLinking';

const onNotification = (notification) => {
	if (notification) {
		const data = notification.getData();
		if (data) {
			try {
				const {
					rid, name, sender, type, host
				} = EJSON.parse(data.ejson);

				const types = {
					c: 'channel', d: 'direct', p: 'group'
				};
				const roomName = type === 'd' ? sender.username : name;

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

const initializePushNotifications = () => {
	PushNotification.configure({
		onNotification
	});
};

const getDeviceToken = () => PushNotification.getDeviceToken();

export { initializePushNotifications, getDeviceToken };
