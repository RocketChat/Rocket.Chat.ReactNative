import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox } from 'react-native';
import VoipPushNotification from 'react-native-voip-push-notification';

import { name as appName } from './app.json';
import { isAndroid, isIOS } from './app/lib/methods/helpers';

if (process.env.USE_STORYBOOK) {
	AppRegistry.registerComponent(appName, () => require('./.rnstorybook/index').default);
} else {
	if (!__DEV__) {
		console.log = () => {};
		console.time = () => {};
		console.timeLog = () => {};
		console.timeEnd = () => {};
		console.warn = () => {};
		console.count = () => {};
		console.countReset = () => {};
		console.error = () => {};
		console.info = () => {};
	}

	LogBox.ignoreAllLogs();

	if (isIOS) {
		VoipPushNotification.addEventListener('register', token => {
			console.log('VoIP Token:', token);
			// Send token to your server
		});

		VoipPushNotification.addEventListener('notification', notification => {
			console.log('VoIP Notification Received:', notification);
			const { uuid, callerName, handle } = notification;

			VoipPushNotification.onVoipNotificationCompleted(uuid);
		});

		VoipPushNotification.addEventListener('didLoadWithEvents', events => {
			if (!events || !Array.isArray(events) || events.length < 1) {
				return;
			}
			for (const voipPushEvent of events) {
				const { name, data } = voipPushEvent;
				console.log('didLoadWithEvents', voipPushEvent);
				if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
					console.log('didLoadWithEvents VoIP Token: ', data);
				} else if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
					// onVoipPushNotificationiReceived(data);
				}
			}
		});
		VoipPushNotification.registerVoipToken();
	}

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
