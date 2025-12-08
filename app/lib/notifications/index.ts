import EJSON from 'ejson';

import { appInit } from '../../actions/app';
import { deepLinkingClickCallPush, deepLinkingOpen } from '../../actions/deepLinking';
import { type INotification, SubscriptionType } from '../../definitions';
import { isIOS } from '../methods/helpers';
import { store } from '../store/auxStore';
import { deviceToken, pushNotificationConfigure, removeAllNotifications, setNotificationsBadgeCount } from './push';

interface IEjson {
	rid: string;
	name: string;
	sender: { username: string; name: string };
	type: string;
	host: string;
	messageId: string;
	notificationType?: string;
}

export const onNotification = (push: INotification): void => {
	const identifier = String(push?.payload?.action?.identifier);

	if (identifier === 'ACCEPT_ACTION' || identifier === 'DECLINE_ACTION') {
		if (push?.payload && push?.payload?.ejson) {
			const notification = EJSON.parse(push?.payload?.ejson);
			const event = identifier === 'ACCEPT_ACTION' ? 'accept' : 'decline';
			store.dispatch(deepLinkingClickCallPush({ ...notification, event }));
			return;
		}
	}

	// On iOS cold start, video conf notifications come without action info initially.
	// Skip processing here - the registerNotificationOpened handler will handle it with action info.
	if (isIOS && push?.payload?.ejson) {
		try {
			const ejsonData: IEjson = EJSON.parse(push.payload.ejson);
			if (ejsonData.notificationType === 'videoconf') {
				return;
			}
		} catch {
			// Continue with normal processing if ejson parsing fails
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
export const initializePushNotifications = (): Promise<INotification | { configured: boolean }> | undefined => {
	setBadgeCount();
	return pushNotificationConfigure(onNotification);
};
