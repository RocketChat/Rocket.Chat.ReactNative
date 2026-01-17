import EJSON from 'ejson';
import { Platform } from 'react-native';

import { appInit } from '../../actions/app';
import { deepLinkingClickCallPush, deepLinkingOpen } from '../../actions/deepLinking';
import { type INotification, SubscriptionType } from '../../definitions';
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

	// Handle video conf notification actions (Accept/Decline buttons)
	if (identifier === 'ACCEPT_ACTION' || identifier === 'DECLINE_ACTION') {
		if (push?.payload?.ejson) {
			try {
				const notification = EJSON.parse(push.payload.ejson);
				store.dispatch(
					deepLinkingClickCallPush({ ...notification, event: identifier === 'ACCEPT_ACTION' ? 'accept' : 'decline' })
				);
				return;
			} catch (e) {
				console.warn('[notifications/index.ts] Failed to parse video conf notification:', e);
			}
		}
	}

	if (push?.payload?.ejson) {
		try {
			const notification = EJSON.parse(push.payload.ejson);

			// Handle video conf notification tap (default action) - treat as accept
			if (notification?.notificationType === 'videoconf') {
				store.dispatch(deepLinkingClickCallPush({ ...notification, event: 'accept' }));
				return;
			}

			// Handle regular message notifications
			if (!notification?.rid || !notification?.type || !notification?.host) {
				store.dispatch(appInit());
				return;
			}
			const { rid, name, sender, type, host, messageId }: IEjson = notification;
			const types: Record<string, string> = {
				c: 'channel',
				d: 'direct',
				p: 'group',
				l: 'channels'
			};
			let roomName = name;
			if (type === SubscriptionType.DIRECT) {
				roomName = sender?.username ?? name;
			} else if (type === SubscriptionType.OMNICHANNEL) {
				roomName = sender?.name ?? name;
			}

			const params = {
				host,
				rid,
				messageId,
				path: `${types[type]}/${roomName}`
			};
			store.dispatch(deepLinkingOpen(params));
			return;
		} catch (e) {
			console.warn('[notifications/index.ts] Failed to parse ejson:', e);
		}
	} else {
		console.warn('[notifications/index.ts] No ejson in payload, dispatching appInit');
	}
	store.dispatch(appInit());
};

export const getDeviceToken = (): string => deviceToken;
export const setBadgeCount = (count?: number): void => {
	setNotificationsBadgeCount(count);
};
export const removeNotificationsAndBadge = async (): Promise<void> => {
	await removeAllNotifications();
	await setNotificationsBadgeCount();
};
export const initializePushNotifications = async (): Promise<INotification | { configured: boolean } | null> => {
	await setNotificationsBadgeCount();
	return pushNotificationConfigure(onNotification);
};

/**
 * Check for pending notification from native module (Android - when app comes to foreground)
 * This handles the case when app is in background and user taps a notification.
 */
export const checkPendingNotification = async (): Promise<void> => {
	if (Platform.OS === 'android') {
		try {
			const NativePushNotificationModule = require('../native/NativePushNotificationAndroid').default;
			if (NativePushNotificationModule) {
				const pendingNotification = await NativePushNotificationModule.getPendingNotification();
				if (pendingNotification) {
					try {
						const notificationData = JSON.parse(pendingNotification);
						const notification: INotification = {
							payload: {
								message: notificationData.message || '',
								style: notificationData.style || '',
								ejson: notificationData.ejson || '',
								collapse_key: notificationData.collapse_key || '',
								notId: notificationData.notId || '',
								msgcnt: notificationData.msgcnt || '',
								title: notificationData.title || '',
								from: notificationData.from || '',
								image: notificationData.image || '',
								soundname: notificationData.soundname || '',
								action: notificationData.action
							},
							identifier: notificationData.notId || ''
						};
						onNotification(notification);
					} catch (e) {
						console.warn('[notifications/index.ts] Failed to parse pending notification:', e);
					}
				}
			}
		} catch (e) {
			console.warn('[notifications/index.ts] Error checking pending notification:', e);
		}
	}
};
