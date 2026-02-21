import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox } from 'react-native';

import { name as appName } from './app.json';
import { isAndroid } from './app/lib/methods/helpers';

if (process.env.USE_STORYBOOK) {
	const StorybookModule = require('./.rnstorybook/index');
	AppRegistry.registerComponent(appName, () => require('./.rnstorybook/index').default ?? StorybookModule);
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

	// Note: Android video conference notifications are now handled natively
	// in RCFirebaseMessagingService -> CustomPushNotification -> VideoConfNotification

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
