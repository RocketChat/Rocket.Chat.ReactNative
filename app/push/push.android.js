import { NotificationsAndroid, PendingNotifications } from 'react-native-notifications';

class PushNotification {
	constructor() {
		this.onRegister = null;
		this.onNotification = null;
		this.deviceToken = null;

		NotificationsAndroid.setRegistrationTokenUpdateListener((deviceToken) => {
			this.deviceToken = deviceToken;
		});

		NotificationsAndroid.setNotificationOpenedListener((notification) => {
			this.onNotification(notification);
		});
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = () => {}

	configure(params) {
		this.onRegister = params.onRegister;
		this.onNotification = params.onNotification;

		PendingNotifications.getInitialNotification()
			.then((notification) => {
				this.onNotification(notification);
			})
			.catch(e => console.warn(e));
	}
}

export default new PushNotification();
