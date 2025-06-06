import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox, PermissionsAndroid, Platform } from 'react-native';

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
		additionalPermissions: [
			PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
			'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
			PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
			PermissionsAndroid.PERMISSIONS.CALL_PHONE
		],
		// Required to get audio in background when using Android 11
		foregroundService: {
			channelId: 'Rocket.Chat Voip',
			channelName: 'Foreground service for my app',
			notificationTitle: 'My app is running on background',
			notificationIcon: 'Path to the resource icon of the notification'
		}
	}
};

// Setup CallKeep with proper error handling
const setupCallKeep = async () => {
	try {
		if (isAndroid) {
			// Request permissions before setting up CallKeep on Android
			const permissions = [
				PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
				'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
				PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
				PermissionsAndroid.PERMISSIONS.CALL_PHONE
			];

			const results = await PermissionsAndroid.requestMultiple(permissions);
			const allGranted = Object.values(results).every(result => result === 'granted');

			if (!allGranted) {
				console.log('CallKeep permissions not granted:', results);
				return;
			}
		}

		const accepted = await RNCallKeep.setup(options);
		console.log('CallKeep setup completed:', accepted);

		// Register phone account for Android
		if (isAndroid) {
			await RNCallKeep.registerPhoneAccount(options);
			console.log('Phone account registered');
		}
	} catch (error) {
		console.error('CallKeep setup failed:', error);
	}
};

setupCallKeep();

// CallKeep event listeners
RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
	console.log('Call answered:', callUUID);
	setTimeout(() => {
		RNCallKeep.backToForeground();
		RNCallKeep.endCall(callUUID);

		alert('Call answered');

		// Handle call answer - you can dispatch to your Redux store or handle app navigation
	}, 1000);
});

RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
	console.log('Call ended:', callUUID);
	// Handle call end
});

RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
	console.log('Call muted:', { muted, callUUID });
	// Handle mute action
});

RNCallKeep.addEventListener('didPerformDTMFAction', ({ dtmf, callUUID }) => {
	console.log('DTMF:', { dtmf, callUUID });
	// Handle DTMF if needed
});

RNCallKeep.addEventListener('didActivateAudioSession', () => {
	console.log('Audio session activated');
	// Handle audio session activation
});

RNCallKeep.addEventListener('didDeactivateAudioSession', () => {
	console.log('Audio session deactivated');
	// Handle audio session deactivation
});

RNCallKeep.addEventListener('didDisplayIncomingCall', args => {
	console.log('didDisplayIncomingCall', args);
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
		RNCallKeep.displayIncomingCall('E26B14F7-2CDF-48D0-9925-532199AE7C45', 'handle', 'callerName');
		console.log('on message after incoming call');
	});

	getMessaging().setBackgroundMessageHandler(message => {
		console.log('Message received:', message);
		RNCallKeep.displayIncomingCall('E26B14F7-2CDF-48D0-9925-532199AE7C45', 'handle', 'callerName');
		console.log('background after incoming call');
	});

	// const setBackgroundNotificationHandler = () => {
	// 	createChannel();
	// 	messaging().setBackgroundMessageHandler(async message => {
	// 		if (message?.data?.ejson) {
	// 			const notification: any = ejson.parse(message?.data?.ejson as string);
	// 			if (notification?.notificationType === VIDEO_CONF_TYPE) {
	// 				if (notification.status === 0) {
	// 					await displayVideoConferenceNotification(notification);
	// 				} else if (notification.status === 4) {
	// 					const id = `${notification.rid}${notification.caller?._id}`.replace(/[^A-Za-z0-9]/g, '');
	// 					await notifee.cancelNotification(id);
	// 				}
	// 			}
	// 		}

	// 		return null;
	// 	});
	// };

	// setBackgroundNotificationHandler();
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

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
