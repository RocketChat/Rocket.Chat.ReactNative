import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox, PermissionsAndroid, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import { name as appName } from './app.json';

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

	// Do not gate this on a PackageManager feature: FEATURE_TELECOM is only declared from API 33,
	// so gating skipped setup() on every older device, leaving endCall and the CallKeep event
	// listeners dead. Devices without the Telecom subsystem are handled natively — registerPhoneAccount
	// bails on !FEATURE_TELECOM (see patches/react-native-callkeep+4.3.16.patch).
	if (Platform.OS === 'android') {
		const options = {
			android: {
				// TODO: i18n
				alertTitle: 'Permissions required',
				alertDescription: 'This application needs to access your phone accounts',
				cancelButton: 'Cancel',
				okButton: 'Ok',
				imageName: 'phone_account_icon',
				additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
				// Required to get audio in background when using Android 11
				foregroundService: {
					channelId: 'chat.rocket.reactnative',
					channelName: 'Rocket.Chat',
					notificationTitle: 'Voice call is running on background'
				},
				selfManaged: true
			}
		};

		RNCallKeep.setup(options)
			.then(() => {
				console.log('RNCallKeep setup successful');
				RNCallKeep.canMakeMultipleCalls(false);
			})
			.catch(error => {
				console.error('Error setting up RNCallKeep:', error);
			});
	}

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
