import EJSON from 'ejson';
import RNUserDefaults from 'rn-user-defaults';

import PushNotification from './push';
import store from '../../lib/createStore';
import { deepLinkingOpen } from '../../actions/deepLinking';
import RocketChat from '../../lib/rocketchat';
import random from '../../utils/random';
import { completeUrl } from '../../utils/server';

export const onNotification = (notification) => {
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

export const onReply = async(notification, action) => {
	if (notification) {
		const data = notification.getData();
		if (data) {
			try {
				const { rid, host } = EJSON.parse(data.ejson);
				const { text } = action;

				const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ host }`);
				const token = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ userId }`);

				fetch(`${ completeUrl(host) }/api/v1/chat.sendMessage`, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'x-auth-token': token,
						'x-user-id': userId
					},
					body: JSON.stringify({
						message: {
							_id: random(17),
							rid,
							msg: text,
							tmid: null
						}
					})
				});
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
		onNotification,
		onReply
	});
};
