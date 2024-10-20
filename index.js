import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry } from 'react-native';

import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';
import { name as appName, share as shareName } from './app.json';
import { isFDroidBuild } from './app/lib/constants';
import { isAndroid } from './app/lib/methods/helpers';

if (!firebase.apps.length) {
	firebase.initializeApp();
}

analytics().setAnalyticsCollectionEnabled(true);

analytics().logEvent('app_open', {
	platform: 'android'
});

if (__DEV__) {
	require('./app/ReactotronConfig');
} else {
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

if (!isFDroidBuild && isAndroid) {
	require('./app/lib/notifications/videoConf/backgroundNotificationHandler');
}

AppRegistry.registerComponent(appName, () => require('./app/index').default);
AppRegistry.registerComponent(shareName, () => require('./app/share').default);

// For storybook, comment everything above and uncomment below
// import 'react-native-gesture-handler';
// import 'react-native-console-time-polyfill';
// import { AppRegistry } from 'react-native';
// import { name as appName } from './app.json';

// require('./app/ReactotronConfig');

// AppRegistry.registerComponent(appName, () => require('./.storybook/index').default);
