import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox } from 'react-native';

import './app/unistyles';
import { name as appName } from './app.json';
import { isAndroid } from './app/lib/methods/helpers';

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

	if (isAndroid) {
		require('./app/lib/notifications/videoConf/backgroundNotificationHandler');
	}

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
