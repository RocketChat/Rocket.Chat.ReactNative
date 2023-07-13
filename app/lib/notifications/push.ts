import {
	Notifications,
	Registered,
	RegistrationError,
	NotificationCompletion,
	Notification,
	NotificationAction,
	NotificationCategory
} from 'react-native-notifications';
import { PermissionsAndroid, Platform } from 'react-native';

import { INotification } from '../../definitions';
import { isIOS } from '../methods/helpers';
import { store as reduxStore } from '../store/auxStore';
import I18n from '../../i18n';

export let deviceToken = '';

export const setNotificationsBadgeCount = (count = 0): void => {
	if (isIOS) {
		Notifications.ios.setBadgeCount(count);
	}
};

export const removeAllNotifications = (): void => {
	Notifications.removeAllDeliveredNotifications();
};

export const pushNotificationConfigure = (onNotification: (notification: INotification) => void): Promise<any> => {
	if (isIOS) {
		// init
		Notifications.ios.registerRemoteNotifications();
		// setCategories
		const notificationAction = new NotificationAction('REPLY_ACTION', 'background', I18n.t('Reply'), true, {
			buttonTitle: I18n.t('Reply'),
			placeholder: I18n.t('Type_message')
		});
		const notificationCategory = new NotificationCategory('MESSAGE', [notificationAction]);
		Notifications.setCategories([notificationCategory]);
	} else if (Platform.OS === 'android' && Platform.constants.Version >= 33) {
		PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).then(permissionStatus => {
			if (permissionStatus === 'granted') {
				Notifications.registerRemoteNotifications();
			} else {
				// TODO: Ask user to enable notifications
			}
		});
	} else {
		Notifications.registerRemoteNotifications();
	}

	Notifications.events().registerRemoteNotificationsRegistered((event: Registered) => {
		deviceToken = event.deviceToken;
	});

	Notifications.events().registerRemoteNotificationsRegistrationFailed((event: RegistrationError) => {
		// TODO: Handle error
		console.log(event);
	});

	Notifications.events().registerNotificationReceivedForeground(
		(notification: Notification, completion: (response: NotificationCompletion) => void) => {
			completion({ alert: false, sound: false, badge: false });
		}
	);

	Notifications.events().registerNotificationOpened((notification: Notification, completion: () => void) => {
		if (isIOS) {
			const { background } = reduxStore.getState().app;
			if (background) {
				onNotification(notification);
			}
		} else {
			onNotification(notification);
		}
		completion();
	});

	Notifications.events().registerNotificationReceivedBackground(
		(notification: Notification, completion: (response: any) => void) => {
			completion({ alert: true, sound: true, badge: false });
		}
	);

	return Notifications.getInitialNotification();
};
