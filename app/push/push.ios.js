import NotificationsIOS from 'react-native-notifications';

class PushNotification {
	constructor() {
		this.onRegister = null;
		this.onNotification = null;
		this.deviceToken = null;

		NotificationsIOS.addEventListener('remoteNotificationsRegistered', (deviceToken) => {
			this.deviceToken = deviceToken;
		});

		NotificationsIOS.addEventListener('notificationOpened', (notification) => {
			this.onNotification(notification);
		});

		NotificationsIOS.requestPermissions();
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	configure(params) {
		this.onRegister = params.onRegister;
		this.onNotification = params.onNotification;

		NotificationsIOS.consumeBackgroundQueue();
	}
}
export default new PushNotification();
