import EJSON from 'ejson';

import PushNotification from './push';
import store from '../../lib/createStore';
import { deepLinkingOpen } from '../../actions/deepLinking';
import RocketChat from '../../lib/rocketchat';

export const onNotification = (notification, action) => {
	if (notification) {
		const data = notification.getData();
		const { rid } = data;
		if (action) {
			const { text } = action;
			RocketChat.sendMessage(rid, text, null, {
				id
				username
				token
			});
		}
	}

	// 	if (data) {
	// 		try {
	// 			const {
	// 				rid, name, sender, type, host
	// 			} = EJSON.parse(data.ejson);

	// 			if (action) {
	// 				const { text } = action;
	// 				RocketChat.sendMessage(rid, text, null, {
	// 					id: 'phq3Dxnf9mNXSBcj4',
	// 					username: 'djorkaeff.alexandre',
	// 					token
	// 				});
	// 			}

	// 			const types = {
	// 				c: 'channel', d: 'direct', p: 'group'
	// 			};
	// 			const roomName = type === 'd' ? sender.username : name;

	// 			const params = {
	// 				host,
	// 				rid,
	// 				path: `${ types[type] }/${ roomName }`
	// 			};
	// 			store.dispatch(deepLinkingOpen(params));
	// 		} catch (e) {
	// 			console.warn(e);
	// 		}
	// 	}
	// }
};

export const getDeviceToken = () => PushNotification.getDeviceToken();
export const setBadgeCount = count => PushNotification.setBadgeCount(count);
export const initializePushNotifications = () => {
	setBadgeCount();
	return PushNotification.configure({
		onNotification
	});
};
