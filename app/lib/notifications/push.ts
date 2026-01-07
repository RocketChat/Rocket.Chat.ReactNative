import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { type INotification } from '../../definitions';
import { isIOS } from '../methods/helpers';
import { store as reduxStore } from '../store/auxStore';
import { registerPushToken } from '../services/restApi';
import I18n from '../../i18n';
import NativePushNotificationModule from '../native/NativePushNotificationAndroid';

export let deviceToken = '';

export const setNotificationsBadgeCount = async (count = 0): Promise<void> => {
	try {
		await Notifications.setBadgeCountAsync(count);
	} catch (e) {
		console.log('Failed to set badge count:', e);
	}
};

export const removeAllNotifications = async (): Promise<void> => {
	try {
		await Notifications.dismissAllNotificationsAsync();
	} catch (e) {
		console.log('Failed to dismiss notifications:', e);
	}
};

let configured = false;

/**
 * Transform expo-notifications response to the INotification format expected by the app
 */
const transformNotificationResponse = (response: Notifications.NotificationResponse): INotification => {
	const { notification, actionIdentifier, userText } = response;
	const { trigger, content } = notification.request;

	console.log('[push.ts] transformNotificationResponse - raw data:', {
		hasTrigger: !!trigger,
		triggerType: trigger && 'type' in trigger ? trigger.type : 'unknown',
		hasContent: !!content,
		hasContentData: !!content.data,
		actionIdentifier
	});

	// Get the raw data from the notification
	let payload: Record<string, any> = {};

	if (trigger && 'type' in trigger && trigger.type === 'push') {
		if (Platform.OS === 'android' && 'remoteMessage' in trigger && trigger.remoteMessage) {
			// Android: data comes from remoteMessage.data
			payload = trigger.remoteMessage.data || {};
			console.log('[push.ts] Android - extracted from remoteMessage.data:', {
				keys: Object.keys(payload),
				hasEjson: !!payload.ejson,
				ejsonLength: payload.ejson?.length || 0
			});
		} else if (Platform.OS === 'ios' && 'payload' in trigger && trigger.payload) {
			// iOS: data comes from payload (userInfo)
			payload = trigger.payload as Record<string, any>;
			console.log('[push.ts] iOS - extracted from trigger.payload:', {
				keys: Object.keys(payload),
				hasEjson: !!payload.ejson,
				ejsonLength: payload.ejson?.length || 0
			});
		}
	}

	// Fallback to content.data if trigger data is not available
	if (Object.keys(payload).length === 0 && content.data) {
		payload = content.data as Record<string, any>;
		console.log('[push.ts] Fallback - extracted from content.data:', {
			keys: Object.keys(payload),
			hasEjson: !!payload.ejson,
			ejsonLength: payload.ejson?.length || 0
		});
	}

	// Add action identifier if it's a specific action (not default tap)
	if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
		payload.action = { identifier: actionIdentifier };
		if (userText) {
			payload.action.userText = userText;
		}
	}

	const transformed = {
		payload: {
			message: content.body || payload.message || '',
			style: payload.style || '',
			ejson: payload.ejson || '',
			collapse_key: payload.collapse_key || '',
			notId: payload.notId || notification.request.identifier || '',
			msgcnt: payload.msgcnt || '',
			title: content.title || payload.title || '',
			from: payload.from || '',
			image: payload.image || '',
			soundname: payload.soundname || '',
			action: payload.action
		},
		identifier: notification.request.identifier
	};

	console.log('[push.ts] transformNotificationResponse - transformed:', {
		hasEjson: !!transformed.payload.ejson,
		ejsonLength: transformed.payload.ejson?.length || 0,
		notId: transformed.payload.notId,
		title: transformed.payload.title
	});

	return transformed;
};

/**
 * Set up notification categories for iOS (actions like Reply, Accept, Decline)
 */
const setupNotificationCategories = async (): Promise<void> => {
	if (!isIOS) {
		return;
	}

	try {
		// Message category with Reply action
		await Notifications.setNotificationCategoryAsync('MESSAGE', [
			{
				identifier: 'REPLY_ACTION',
				buttonTitle: I18n.t('Reply'),
				textInput: {
					submitButtonTitle: I18n.t('Reply'),
					placeholder: I18n.t('Type_message')
				},
				options: {
					opensAppToForeground: false
				}
			}
		]);

		// Video conference category with Accept/Decline actions
		await Notifications.setNotificationCategoryAsync('VIDEOCONF', [
			{
				identifier: 'ACCEPT_ACTION',
				buttonTitle: I18n.t('accept'),
				options: {
					opensAppToForeground: true
				}
			},
			{
				identifier: 'DECLINE_ACTION',
				buttonTitle: I18n.t('decline'),
				options: {
					opensAppToForeground: true
				}
			}
		]);
	} catch (e) {
		console.log('Failed to set notification categories:', e);
	}
};

/**
 * Request notification permissions and register for push notifications
 */
const registerForPushNotifications = async (): Promise<string | null> => {
	if (!Device.isDevice) {
		console.log('Push notifications require a physical device');
		return null;
	}

	try {
		// Check and request permissions
		const { status: existingStatus } = await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== 'granted') {
			console.log('Failed to get push notification permissions');
			return null;
		}

		// Get the device push token (FCM for Android, APNs for iOS)
		const tokenData = await Notifications.getDevicePushTokenAsync();
		return tokenData.data;
	} catch (e) {
		console.log('Error registering for push notifications:', e);
		return null;
	}
};

export const pushNotificationConfigure = (onNotification: (notification: INotification) => void): Promise<any> => {
	if (configured) {
		return Promise.resolve({ configured: true });
	}

	configured = true;

	// Set up how notifications should be handled when the app is in foreground
	Notifications.setNotificationHandler({
		handleNotification: () =>
			Promise.resolve({
				shouldShowAlert: false,
				shouldPlaySound: false,
				shouldSetBadge: false,
				shouldShowBanner: false,
				shouldShowList: false
			})
	});

	// Set up notification categories for iOS
	setupNotificationCategories();

	// Register for push notifications and get token
	registerForPushNotifications().then(token => {
		if (token) {
			deviceToken = token;
		}
	});

	// Listen for token updates (FCM can refresh tokens at any time)
	Notifications.addPushTokenListener(tokenData => {
		deviceToken = tokenData.data;
		// Re-register with server if user is logged in
		const { isAuthenticated } = reduxStore.getState().login;
		if (isAuthenticated) {
			registerPushToken().catch(e => {
				console.log('Failed to re-register push token after refresh:', e);
			});
		}
	});

	// Listen for notification responses (when user taps on notification)
	Notifications.addNotificationResponseReceivedListener(response => {
		console.log('[push.ts] Notification response received:', {
			actionIdentifier: response.actionIdentifier,
			notificationId: response.notification.request.identifier,
			hasTrigger: !!response.notification.request.trigger,
			hasContent: !!response.notification.request.content
		});

		const notification = transformNotificationResponse(response);

		console.log('[push.ts] Transformed notification:', {
			hasPayload: !!notification.payload,
			hasEjson: !!notification.payload?.ejson,
			ejsonLength: notification.payload?.ejson?.length || 0,
			notId: notification.payload?.notId,
			title: notification.payload?.title,
			message: notification.payload?.message ? `${notification.payload.message.substring(0, 50)}...` : undefined
		});

		if (isIOS) {
			const { background } = reduxStore.getState().app;
			if (background) {
				console.log('[push.ts] iOS background, calling onNotification');
				onNotification(notification);
			} else {
				console.log('[push.ts] iOS foreground, skipping onNotification');
			}
		} else {
			console.log('[push.ts] Android, calling onNotification');
			onNotification(notification);
		}
	});

	// Get initial notification (app was opened by tapping a notification)
	// First check native module for stored notification data (Android - when notification was created natively)
	if (Platform.OS === 'android' && NativePushNotificationModule) {
		return NativePushNotificationModule.getPendingNotification()
			.then(pendingNotification => {
				if (pendingNotification) {
					try {
						// Parse the stored notification data
						const notificationData = JSON.parse(pendingNotification);

						// Transform to INotification format
						const transformed: INotification = {
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

						return transformed;
					} catch (parseError) {
						console.error('[push.ts] Error parsing notification data:', parseError);
						return null;
					}
				}
				return null;
			})
			.catch(e => {
				console.error('[push.ts] Error getting pending notification from native module:', e);
				return null;
			})
			.then(nativeNotification => {
				if (nativeNotification) {
					return nativeNotification;
				}

				// Fallback to expo-notifications (for iOS or if native module doesn't have data)
				const lastResponse = Notifications.getLastNotificationResponse();
				if (lastResponse) {
					return transformNotificationResponse(lastResponse);
				}

				return null;
			})
			.catch(e => {
				console.error('[push.ts] Error in promise chain:', e);
				return null;
			});
	}

	// Fallback to expo-notifications (for iOS or if native module doesn't have data)
	const lastResponse = Notifications.getLastNotificationResponse();
	if (lastResponse) {
		return Promise.resolve(transformNotificationResponse(lastResponse));
	}

	return Promise.resolve(null);
};
