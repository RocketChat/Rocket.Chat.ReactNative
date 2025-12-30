import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { type INotification } from '../../definitions';
import { isIOS } from '../methods/helpers';
import { store as reduxStore } from '../store/auxStore';
import { registerPushToken } from '../services/restApi';
import I18n from '../../i18n';

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

	// Get the raw data from the notification
	let payload: Record<string, any> = {};

	if (trigger && 'type' in trigger && trigger.type === 'push') {
		if (Platform.OS === 'android' && 'remoteMessage' in trigger && trigger.remoteMessage) {
			// Android: data comes from remoteMessage.data
			payload = trigger.remoteMessage.data || {};
		} else if (Platform.OS === 'ios' && 'payload' in trigger && trigger.payload) {
			// iOS: data comes from payload (userInfo)
			payload = trigger.payload as Record<string, any>;
		}
	}

	// Fallback to content.data if trigger data is not available
	if (Object.keys(payload).length === 0 && content.data) {
		payload = content.data as Record<string, any>;
	}

	// Add action identifier if it's a specific action (not default tap)
	if (actionIdentifier && actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
		payload.action = { identifier: actionIdentifier };
		if (userText) {
			payload.action.userText = userText;
		}
	}

	return {
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
		const notification = transformNotificationResponse(response);

		if (isIOS) {
			const { background } = reduxStore.getState().app;
			if (background) {
				onNotification(notification);
			}
		} else {
			onNotification(notification);
		}
	});

	// Get initial notification (app was opened by tapping a notification)
	const lastResponse = Notifications.getLastNotificationResponse();
	if (lastResponse) {
		return Promise.resolve(transformNotificationResponse(lastResponse));
	}

	return Promise.resolve(null);
};
