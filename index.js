import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox } from 'react-native';

import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';

import { name as appName } from './app.json';
import { isAndroid } from './app/lib/methods/helpers';

const options = {
	ios: {
		appName: 'Rocket.Chat',
		supportsVideo: true,
		maximumCallGroups: 1,
		maximumCallsPerCallGroup: 1,
		includesCallsInRecents: false
	}
};

RNCallKeep.setup(options).then(accepted => {
	console.log('CallKeep setup completed:', accepted);
});

// CallKeep event listeners
RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
	console.log('Call answered:', callUUID);
	// Handle call answer - you can dispatch to your Redux store or handle app navigation
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

VoipPushNotification.addEventListener('register', token => {
	console.log('VoIP Token:', token);
	// Send token to your server
});

function onVoipPushNotificationiReceived(data) {
	console.log('VoIP Notification Received:', data);
	RNCallKeep.displayIncomingCall('E26B14F7-2CDF-48D0-9925-532199AE7C45', 'handle', 'callerName');
}

VoipPushNotification.addEventListener('notification', notification => {
	console.log('VoIP Notification Received:', notification);
	const { uuid, callerName, handle } = notification;
	onVoipPushNotificationiReceived(notification);

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
		if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
			console.log('didLoadWithEvents VoIP Token: ', data);
		} else if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
			onVoipPushNotificationiReceived(data);
		}
	}
});

VoipPushNotification.registerVoipToken();

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

	if (isAndroid) {
		require('./app/lib/notifications/videoConf/backgroundNotificationHandler');
	}

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
