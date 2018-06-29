import NotificationsIOS from 'react-native-notifications';

class App {
	constructor() {
		NotificationsIOS.addEventListener('remoteNotificationsRegistered', this.onPushRegistered.bind(this));
		NotificationsIOS.addEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed.bind(this));
		NotificationsIOS.requestPermissions();
	}

	onPushRegistered = (deviceToken) => {
	    // TODO: Send the token to my server so it could send back push notifications...
		console.log("Device Token Received", deviceToken);
	}

	onPushRegistrationFailed = (error) => {
		// For example:
		//
		// error={
		//   domain: 'NSCocoaErroDomain',
		//   code: 3010,
		//   localizedDescription: 'remote notifications are not supported in the simulator'
		// }
		console.error(error);
	}

	componentWillUnmount() {
		// prevent memory leaks!
		NotificationsIOS.removeEventListener('remoteNotificationsRegistered', this.onPushRegistered.bind(this));
		NotificationsIOS.removeEventListener('remoteNotificationsRegistrationFailed', this.onPushRegistrationFailed.bind(this));
	}
}
export default new App();
