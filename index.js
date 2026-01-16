import 'react-native-gesture-handler';
import 'react-native-console-time-polyfill';
import { AppRegistry, LogBox } from 'react-native';
import VoipPushNotification from 'react-native-voip-push-notification';
import RNCallKeep from 'react-native-callkeep';

import { name as appName } from './app.json';
import { isIOS } from './app/lib/methods/helpers';
import {
	setPendingCall,
	markPendingCallAnswered,
	markPendingCallDeclined,
	getPendingCall
} from './app/lib/services/voip/pendingCallStore';
import { CallIdUUIDModule } from './app/lib/native/CallIdUUID';
import store from './app/lib/store';
import { voipCallOpen } from './app/actions/deepLinking';

/**
 * Handle VoIP push notification received.
 * Stores the call info in pending store for later processing.
 */
const handleVoipNotification = notification => {
	console.log('[VoIP] Notification Received:', notification);
	const { callId, caller, host } = notification;

	if (callId) {
		const callUUID = CallIdUUIDModule.toUUID(callId);
		setPendingCall({
			callId,
			callUUID,
			caller: caller || 'Unknown',
			host
		});
	}

	// Mark notification as completed
	if (notification.uuid) {
		VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
	}
};

/**
 * Handle CallKeep answer call event (from cold start).
 * This fires when user answered before JS was fully initialized.
 */
const handleCallKeepAnswerCall = ({ callUUID }) => {
	console.log('[VoIP] CallKeep answerCall from cold start:', callUUID);
	markPendingCallAnswered();

	// Dispatch action to handle server switching and call connection
	const pendingCall = getPendingCall();
	if (pendingCall && pendingCall.host) {
		store.dispatch(voipCallOpen({ callId: pendingCall.callId, callUUID, host: pendingCall.host }));
	}
};

/**
 * Handle CallKeep end call event (from cold start).
 */
const handleCallKeepEndCall = ({ callUUID }) => {
	console.log('[VoIP] CallKeep endCall from cold start:', callUUID);
	markPendingCallDeclined();
};

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
		// VoIP Push Notification handlers
		VoipPushNotification.addEventListener('register', token => {
			console.log('[VoIP] Token:', token);
			// Token will be sent to server during login
		});

		VoipPushNotification.addEventListener('notification', handleVoipNotification);

		VoipPushNotification.addEventListener('didLoadWithEvents', events => {
			if (!events || !Array.isArray(events) || events.length < 1) {
				return;
			}
			console.log('[VoIP] didLoadWithEvents:', events.length, 'events');
			for (const voipPushEvent of events) {
				const { name, data } = voipPushEvent;
				if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
					console.log('[VoIP] Token from cold start:', data);
				} else if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
					handleVoipNotification(data);
				}
			}
		});

		// CallKeep handlers for cold start scenario
		// These handle events that occurred before JS was initialized
		RNCallKeep.addEventListener('didLoadWithEvents', events => {
			if (!events || !Array.isArray(events) || events.length < 1) {
				return;
			}
			console.log('[VoIP] CallKeep didLoadWithEvents:', events.length, 'events');
			for (const event of events) {
				const { name, data } = event;
				if (name === 'RNCallKeepPerformAnswerCallAction') {
					handleCallKeepAnswerCall(data);
				} else if (name === 'RNCallKeepPerformEndCallAction') {
					handleCallKeepEndCall(data);
				}
			}
		});

		VoipPushNotification.registerVoipToken();
	}

	AppRegistry.registerComponent(appName, () => require('./app/index').default);
}
