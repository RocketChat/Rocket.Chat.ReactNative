import EJSON from 'ejson';

import { store } from '../store/auxStore';
import { deepLinkingClickCallPush, deepLinkingOpen } from '../../actions/deepLinking';
import { isFDroidBuild } from '../constants';
import { deviceToken, pushNotificationConfigure, setNotificationsBadgeCount, removeAllNotifications } from './push';
import { INotification, SubscriptionType } from '../../definitions';

interface IEjson {
	rid: string;
	name: string;
	sender: { username: string; name: string };
	type: string;
	host: string;
	messageType: string;
	messageId: string;
}

export const onNotification = (push: INotification): void => {
	const identifier = String(push?.action?.identifier);
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
			const { rid, name, sender, type, host, messageType, messageId }: IEjson = EJSON.parse(notification.ejson);

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
				path: `${types[type]}/${roomName}`,
				isCall: messageType === 'jitsi_call_started'
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
