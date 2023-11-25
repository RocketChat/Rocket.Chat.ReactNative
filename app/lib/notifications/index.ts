import EJSON from 'ejson';
import { Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { deepLinkingClickCallPush, deepLinkingOpen } from '../../actions/deepLinking';
import { INotification, SubscriptionType } from '../../definitions';
import { isFDroidBuild } from '../constants';
import { store } from '../store/auxStore';
import { deviceToken, pushNotificationConfigure, removeAllNotifications, setNotificationsBadgeCount } from './push';

interface IEjson {
	rid: string;
	name: string;
	sender: { username: string; name: string };
	type: string;
	host: string;
	messageId: string;
}

export const onNotification = (push: INotification): void => {
	const identifier = String(push?.payload?.action?.identifier);
	if (identifier === 'ACCEPT_ACTION' || identifier === 'DECLINE_ACTION') {
		if (push.payload) {
			const notification = EJSON.parse(push.payload.ejson);
			store.dispatch(deepLinkingClickCallPush({ ...notification, event: identifier === 'ACCEPT_ACTION' ? 'accept' : 'decline' }));
			return;
		}
	}
	if (push.payload) {
		try {
			const notification = push.payload;
			const { rid, name, sender, type, host, messageId }: IEjson = EJSON.parse(notification.ejson);

			const types: Record<string, string> = {
				c: 'channel',
				d: 'direct',
				p: 'group',
				l: 'channels'
			};
			let roomName = type === SubscriptionType.DIRECT ? sender.username : name;
			if (type === SubscriptionType.OMNICHANNEL) {
				roomName = sender.name;
			}

			const params = {
				host,
				rid,
				messageId,
				path: `${types[type]}/${roomName}`
			};
			store.dispatch(deepLinkingOpen(params));
		} catch (e) {
			console.warn(e);
		}
	}
};

export const getDeviceToken = (): string => deviceToken;
export const setBadgeCount = (count?: number): void => setNotificationsBadgeCount(count);
export const removeNotificationsAndBadge = () => {
	removeAllNotifications();
	setBadgeCount();
};
export const initializePushNotifications = (): Promise<INotification> | undefined => {
	if (!isFDroidBuild) {
		setBadgeCount();
		return pushNotificationConfigure(onNotification);
	}
};

const d = {
	payload: {
		body: 'Conference Call',
		identifier: '3D96ED2D-ECCE-4356-8DBF-72EC7C9EDDF6',
		messageFrom: 'push',
		action: { identifier: 'ACCEPT_ACTION' },
		category: 'VIDEOCONF',
		title: '@xdani',
		date: '2023-11-24T21:15:41.613-03:00',
		aps: {
			category: 'VIDEOCONF',
			'mutable-content': 1,
			badge: 0,
			'thread-id': '-336844140',
			alert: { body: 'Conference Call', title: '@xdani' },
			sound: 'default'
		},
		ejson:
			'{"avatar":"/avatar/xdani","callId":"65613cabe3a89243a8ab41a3","caller":{"_id":"3wPpCChMAKbF8DgY5","name":"xdani","username":"xdani"},"host":"https://candidate.rocket.chat/","notificationType":"videoconf","rid":"3wPpCChMAKbF8DgY5gJRnW27czkp3ksKgH","status":0}',
		thread: '-336844140'
	},
	identifier: '3D96ED2D-ECCE-4356-8DBF-72EC7C9EDDF6'
};
