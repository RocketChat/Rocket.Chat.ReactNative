// @ts-ignore
// TODO BUMP LIB VERSION
import { NotificationsAndroid, PendingNotifications, Notification } from 'react-native-notifications';

import { INotification } from '../../definitions/INotification';

class PushNotification {
	onNotification: (notification: Notification) => void;
	deviceToken: string;
	constructor() {
		this.onNotification = () => {};
		this.deviceToken = '';

		NotificationsAndroid.setRegistrationTokenUpdateListener((deviceToken: string) => {
			this.deviceToken = deviceToken;
		});

		NotificationsAndroid.setNotificationOpenedListener((notification: Notification) => {
			this.onNotification(notification);
		});
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = (_?: number) => {};

	configure(onNotification: (notification: INotification) => void) {
		this.onNotification = onNotification;
		NotificationsAndroid.refreshToken();
		return PendingNotifications.getInitialNotification();
	}
}

export default new PushNotification();
