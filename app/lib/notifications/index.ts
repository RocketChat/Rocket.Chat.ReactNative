import EJSON from 'ejson';

import { appInit } from '../../actions/app';
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
		if (push?.payload && push?.payload?.ejson) {
			const notification = EJSON.parse(push?.payload?.ejson);
			store.dispatch(deepLinkingClickCallPush({ ...notification, event: identifier === 'ACCEPT_ACTION' ? 'accept' : 'decline' }));
			return;
		}
	}
	if (push?.payload) {
		try {
			const notification = push?.payload;
			if (notification.ejson) {
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
				return;
			}
		} catch (e) {
			console.warn(e);
		}
	}
	store.dispatch(appInit());
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
