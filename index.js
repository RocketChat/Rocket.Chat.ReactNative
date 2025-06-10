import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, Linking, LogBox, NativeModules, PermissionsAndroid, View } from 'react-native';

import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';
import { getMessaging } from '@react-native-firebase/messaging';

import { name as appName } from './app.json';
import App from './app/index';
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

// Global handler reference for proper cleanup
let callAnswerHandler = null;

function setupCallKeepAnswerEvent() {
	// Remove any existing listener first to avoid duplicates
	if (callAnswerHandler) {
		RNCallKeep.removeEventListener('answerCall', callAnswerHandler);
	}

	// Define the handler
	callAnswerHandler = ({ callUUID }) => {
		console.log('Call answered:', callUUID);

		// Use your existing CallkeepHelperModule logic
		const { CallkeepHelperModule } = NativeModules;
		CallkeepHelperModule.startActivity();
		RNCallKeep.endCall(callUUID);
	};

	// Add the listener
	RNCallKeep.addEventListener('answerCall', callAnswerHandler);
	console.log('CallKeep answerCall listener set up');
}

// Setup CallKeep with proper error handling
const setupCallKeep = async () => {
	try {
		if (isAndroid) {
			// Request permissions before setting up CallKeep on Android
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

		// Set up the answer call event listener after setup
		setupCallKeepAnswerEvent();

		const initialEvents = await RNCallKeep.getInitialEvents();
		console.log('Initial events:', initialEvents);
	} catch (error) {
		console.error('CallKeep setup failed:', error);
	}
};

setTimeout(() => {
	setupCallKeep();
}, 1000);

// Set up globally - this will be called during initial setup
setupCallKeepAnswerEvent();

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
		console.log('Message received in background:', message);

		// For Android background/killed state, we need to register manually
		try {
			await RNCallKeep.registerPhoneAccount(options);
			await RNCallKeep.registerAndroidEvents();
			await RNCallKeep.setAvailable(true);

			// Set up the event listener again for background context
			setupCallKeepAnswerEvent();

			console.log('CallKeep re-registered for background');
		} catch (error) {
			console.error('Failed to setup CallKeep in background:', error);
		}

		// Now display the incoming call
		RNCallKeep.displayIncomingCall(generateUUID(), 'handle', 'callerName');
		console.log('background after incoming call');
	});
}

// Handle events that occurred before JS bridge was ready
RNCallKeep.addEventListener('didLoadWithEvents', events => {
	console.log('CallKeep didLoadWithEvents:', events);
	// Handle any events that occurred before JS bridge was ready
	events.forEach(event => {
		if (event.name === 'RNCallKeepPerformAnswerCallAction' && callAnswerHandler) {
			console.log('Processing early answerCall event:', event.data);
			callAnswerHandler(event.data);
		}
	});
});

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

	AppRegistry.registerComponent(appName, () => App);
}
