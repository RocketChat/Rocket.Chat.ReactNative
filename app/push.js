import PushNotification from 'react-native-push-notification';
import { AsyncStorage } from 'react-native';
import EJSON from 'ejson';
import { goRoom } from './containers/routes/NavigationService';

const handleNotification = (notification) => {
	if (notification.usernInteraction) {
		return;
	}
	const { rid, name } = EJSON.parse(notification.ejson);
	return rid && name && goRoom({ rid, name });
};
PushNotification.configure({

	// (optional) Called when Token is generated (iOS and Android)
	async onRegister({ token }) {
		AsyncStorage.setItem('pushId', token);
	},

	// (required) Called when a remote or local notification is opened or received
	onNotification: handleNotification,

	// ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
	senderID: '673693445664',

	// IOS ONLY (optional): default: all - Permissions to register.
	permissions: {
		alert: true,
		badge: true,
		sound: true
	},

	// Should the initial notification be popped automatically
	// default: true
	popInitialNotification: true,

	/**
     * (optional) default: true
     * - Specified if permissions (ios) and token (android and ios) will requested or not,
     * - if not, you must call PushNotificationsHandler.requestPermissions() later
     */
	requestPermissions: true
});
