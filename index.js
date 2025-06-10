import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox, PermissionsAndroid, View } from 'react-native';

import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';
import { getMessaging } from '@react-native-firebase/messaging';

import { name as appName } from './app.json';
import { isAndroid, isIOS } from './app/lib/methods/helpers';

const options = {
	ios: {
		appName: 'Rocket.Chat',
		supportsVideo: true,
		maximumCallGroups: 1,
		maximumCallsPerCallGroup: 1,
		includesCallsInRecents: false
	},
	android: {
		alertTitle: 'Permissions required',
		alertDescription: 'This application needs to access your phone accounts',
		cancelButton: 'Cancel',
		okButton: 'ok',
		imageName: 'phone_account_icon',
		additionalPermissions: [],
		// Required to get audio in background when using Android 11
		foregroundService: {
			channelId: 'Rocket.Chat Voip',
			channelName: 'Rocket.Chat Voip',
			notificationTitle: 'Rocket.Chat Voip',
			notificationIcon: 'ic_notification'
		}
	}
};

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

let isCallAccepted = false;

// Setup CallKeep with proper error handling
const setupCallKeep = async () => {
	try {
		if (isAndroid) {
			// Request permissions before setting up CallKeep on Android
			// const permissions = [
			// 	// PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
			// 	// 'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
			// 	PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
			// 	// PermissionsAndroid.PERMISSIONS.CALL_PHONE
			// ];

			// const results = await PermissionsAndroid.requestMultiple(permissions);
			const permissionResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, {
				title: 'Phone Permission Required',
				message:
					'Rocket.Chat needs access to your phone state to handle incoming calls properly. This helps manage call notifications and call handling.',
				buttonNeutral: 'Ask Me Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK'
			});
			console.log('Permission request result:', permissionResult);

			if (permissionResult !== 'granted') {
				console.log('READ_PHONE_STATE permission not granted, CallKeep will have limited functionality');
				// Continue without the permission - CallKeep can still work with reduced functionality
			}
			// const allGranted = Object.values(results).every(result => result === 'granted');

			// if (!allGranted) {
			// 	console.log('CallKeep permissions not granted:', results);
			// 	return;
			// }
		}

		const accepted = await RNCallKeep.setup(options);
		console.log('CallKeep setup completed:', accepted);

		RNCallKeep.setAvailable(true);
		console.log('CallKeep setAvailable');

		// Register phone account for Android
		if (isAndroid) {
			await RNCallKeep.registerPhoneAccount(options);
			console.log('Phone account registered');
		}

		const initialEvents = await RNCallKeep.getInitialEvents();
		console.log('Initial events:', initialEvents);
	} catch (error) {
		console.error('CallKeep setup failed:', error);
	}
};

setTimeout(() => {
	setupCallKeep();
}, 1000);

// CallKeep event listeners
RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
	console.log('Call answered:', callUUID);
	isCallAccepted = true;
	RNCallKeep.endAllCalls();
	RNCallKeep.backToForeground();
	setTimeout(() => {
		// RNCallKeep.endCall(callUUID);

		alert('Call answered');

		console.log('Call answered after end call');
	}, 1000);
});

RNCallKeep.addEventListener('didReceiveStartCallAction', ({ handle, callUUID, name }) => {
	console.log('Call didReceiveStartCallAction:', callUUID);
});

if (isIOS) {
	VoipPushNotification.addEventListener('register', token => {
		console.log('VoIP Token:', token);
		// Send token to your server
	});

	// function onVoipPushNotificationiReceived(data) {
	// 	// RNCallKeep.displayIncomingCall('E26B14F7-2CDF-48D0-9925-532199AE7C45', 'handle', 'callerName');
	// }

	VoipPushNotification.addEventListener('notification', notification => {
		console.log('VoIP Notification Received:', notification);
		const { uuid, callerName, handle } = notification;
		// onVoipPushNotificationiReceived(notification);

		VoipPushNotification.onVoipNotificationCompleted(uuid);
	});

	VoipPushNotification.addEventListener('didLoadWithEvents', events => {
		// --- this will fire when there are events occured before js bridge initialized
		// --- use this event to execute your event handler manually by event type

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
} else {
	// Android

	getMessaging()
		.getToken()
		.then(token => {
			console.log('Token:', token);
		});

	getMessaging().onNotificationOpenedApp(remoteMessage => {
		console.log('Notification caused app to open from background state:', remoteMessage);
	});
	getMessaging().onMessage(remoteMessage => {
		console.log('Message received:', remoteMessage);
		RNCallKeep.displayIncomingCall(generateUUID(), 'handle', 'callerName');
		console.log('on message after incoming call');
	});

	getMessaging().setBackgroundMessageHandler(async message => {
		console.log('Message received:', message);
		await new Promise(resolve => setTimeout(resolve, 1000));
		RNCallKeep.backToForeground();
		RNCallKeep.displayIncomingCall(generateUUID(), 'handle', 'callerName');
		console.log('background after incoming call');
	});
}

function HeadlessCheck({ isHeadless }) {
	return <View style={{ flex: 1, backgroundColor: 'red' }} />;
}

if (process.env.USE_STORYBOOK) {
	AppRegistry.registerComponent(appName, () => require('./.storybook/index').default);
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

	// if (isAndroid) {
	// 	require('./app/lib/notifications/videoConf/backgroundNotificationHandler');
	// }

	if (isCallAccepted) {
		AppRegistry.registerComponent(appName, () => null);
	} else {
		AppRegistry.registerComponent(appName, () => require('./app/index').default);
	}

	// AppRegistry.registerHeadlessTask('RNCallKeepBackgroundMessage', () => ({ name, callUUID, handle }) => {
	// 	console.log('RNCallKeepBackgroundMessage', { name, callUUID, handle });

	// 	return Promise.resolve();
	// });
}
