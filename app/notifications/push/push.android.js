import { NotificationsAndroid, PendingNotifications } from 'react-native-notifications';
import { SocketNotificationsModule } from './SocketNotificationsModule';
import RocketChat from '../../lib/rocketchat';

class PushNotification {
	constructor() {
		this.onRegister = null;
		this.onNotification = null;
		this.deviceToken = null;
	}

	getDeviceToken() {
		return this.deviceToken;
	}

	setBadgeCount = () => {}

	configure = async(params) => {
		this.onRegister = params.onRegister;
		this.onNotification = params.onNotification;
		const allowSocketNotifications = await RocketChat.getAllowSocketNotifications();
		if (allowSocketNotifications) {
			NotificationsAndroid.clearNotificationOpenedListener();
			SocketNotificationsModule.setNotificationOpenedListener((notification) => {
				this.onNotification(notification);
			});
			SocketNotificationsModule.invalidateNotifications();
			return SocketNotificationsModule.getInitialNotification();
		} else {
			NotificationsAndroid.setRegistrationTokenUpdateListener((deviceToken) => {
				this.deviceToken = deviceToken;
			});
	
			NotificationsAndroid.setNotificationOpenedListener((notification) => {
				this.onNotification(notification);
			});
			NotificationsAndroid.refreshToken();
			SocketNotificationsModule.invalidateNotifications();
			return PendingNotifications.getInitialNotification();
		}
	}
}

export default new PushNotification();
