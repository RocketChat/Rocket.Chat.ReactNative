import { Notifications, Registered, RegistrationError, NotificationCompletion, Notification } from 'react-native-notifications';

import { INotification } from '../../definitions/INotification';
import { isIOS } from '../../utils/deviceInfo';
import { store as reduxStore } from '../../lib/auxStore';

class PushNotificationV2 {
	onNotification: (notification: any) => void;
	deviceToken: string;
	constructor() {
		this.onNotification = () => {};
		this.deviceToken = '';
		if (isIOS) {
			// 		const actions = [
			// 			new NotificationCategory({
			// 				identifier: 'MESSAGE',
			// 				actions: [
			// 					new NotificationAction({
			// 						activationMode: 'background',
			// 						title: I18n.t('Reply'),
			// 						textInput: {
			// 							buttonTitle: I18n.t('Reply'),
			// 							placeholder: I18n.t('Type_message')
			// 						},
			// 						identifier: 'REPLY_ACTION'
			// 					})
			// 				]
			// 			})
			// 		];
			// 		NotificationsIOS.requestPermissions(actions);
			Notifications.ios.registerRemoteNotifications();
		} else {
			Notifications.android.registerRemoteNotifications();
		}

		Notifications.events().registerRemoteNotificationsRegistered((event: Registered) => {
			this.deviceToken = event.deviceToken;
		});
		Notifications.events().registerRemoteNotificationsRegistrationFailed((event: RegistrationError) => {
			// TODO: Handle error
			console.log(event);
		});

		Notifications.events().registerNotificationReceivedForeground(
			(notification: Notification, completion: (response: NotificationCompletion) => void) => {
				completion({ alert: true, sound: true, badge: false });
			}
		);

		Notifications.events().registerNotificationOpened((notification: Notification, completion: () => void) => {
			if (isIOS) {
				const { background } = reduxStore.getState().app;
				if (background) {
					this.onNotification(notification);
				}
			} else {
				this.onNotification(notification);
			}
			completion();
		});

		Notifications.events().registerNotificationReceivedBackground(
			(notification: Notification, completion: (response: any) => void) => {
				completion({ alert: true, sound: true, badge: false });
			}
		);
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = (count?: number) => {
		if (isIOS && count) {
			Notifications.ios.setBadgeCount(count);
		}
	};

	configure(onNotification: (notification: INotification) => void): Promise<any> {
		this.onNotification = onNotification;
		return Notifications.getInitialNotification();
	}
}

export default new PushNotificationV2();
