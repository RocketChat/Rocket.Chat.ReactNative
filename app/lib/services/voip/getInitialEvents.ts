import RNCallKeep from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';
import { DeviceEventEmitter } from 'react-native';

import { isIOS } from '../../methods/helpers';
import CallIdUUIDModule from '../../native/NativeCallIdUUID';
import store from '../../store';
import { voipCallOpen } from '../../../actions/deepLinking';
import { setVoipPushToken } from './pushTokenAux';
import { useCallStore } from './useCallStore';
import { mediaSessionInstance } from './MediaSessionInstance';

let NativeVoipModule: any;
if (!isIOS) {
	NativeVoipModule = require('../../native/NativeVoip.android');
} else {
	NativeVoipModule = null;
}

// Store VoIP push data temporarily (iOS only - Android uses native storage)
let voipPushData: { callId: string; caller: string; host?: string; callUUID: string } | null = null;

/**
 * Handles initial VoIP events on app startup.
 *
 * iOS: Uses VoipPushNotification to capture VoIP push data and CallKeep events
 * Android: Uses native module to retrieve pending VoIP call data from Intent/SharedPreferences
 */
export const getInitialEvents = (): Promise<boolean> => {
	if (isIOS) {
		return getInitialEventsIOS();
	}
	return getInitialEventsAndroid();
};

/**
 * Sets up listeners for Android VoIP call events from native side.
 * @returns Cleanup function to remove listeners
 */
export const setupVoipEventListeners = (): (() => void) => {
	if (isIOS) {
		return () => {};
	}

	const subscriptions = [
		DeviceEventEmitter.addListener('VoipCallAction', async (dataJson: string) => {
			try {
				const data = JSON.parse(dataJson);
				console.log('[VoIP][Android] Call action event:', data);
				await NativeVoipModule.clearPendingVoipCall();

				if (data.event === 'accept') {
					useCallStore.getState().setCallUUID(data.callUUID);
					// TODO: how to make sure the call comes from the same workspace? dispatch is just a saga trigger
					store.dispatch(
						voipCallOpen({
							callId: data.callId,
							callUUID: data.callUUID,
							host: data.host
						})
					);
					await mediaSessionInstance.answerCall(data.callUUID);
				}
			} catch (error) {
				console.error('[VoIP][Android] Error handling call action event:', error);
			}
		})
	];

	// Return cleanup function
	return () => {
		subscriptions.forEach(sub => sub.remove());
	};
};

/**
 * iOS-specific implementation using VoipPushNotification and CallKeep
 */
const getInitialEventsIOS = async (): Promise<boolean> => {
	try {
		VoipPushNotification.addEventListener('register', (token: string) => {
			console.log('[VoIP][iOS] Registered VoIP push token:', token);
			setVoipPushToken(token);
		});

		VoipPushNotification.addEventListener('didLoadWithEvents', events => {
			if (!events || !Array.isArray(events)) return;

			for (const event of events) {
				const { name, data } = event;

				if (name === VoipPushNotification.RNVoipPushRemoteNotificationReceivedEvent) {
					const voipData = data as { callId?: string; caller?: string; host?: string };
					const { callId, caller, host } = voipData;
					if (callId) {
						const callUUID = CallIdUUIDModule.toUUID(callId);
						voipPushData = { callId, caller: caller || 'Unknown', host, callUUID };
						console.log('[VoIP][iOS] Stored VoIP push data:', voipPushData);
					}
				}
				if (name === VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent) {
					setVoipPushToken(data);
					console.log('[VoIP][iOS] Registered VoIP push token:', data);
				}
			}
		});

		RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
			console.log('[VoIP][iOS] Live answerCall event received:', callUUID);

			if (voipPushData && voipPushData.callUUID.toLowerCase() === callUUID.toLowerCase()) {
				console.log('[VoIP][iOS] Matched live answer to VoIP call');
				if (voipPushData.host) {
					store.dispatch(
						voipCallOpen({
							callId: voipPushData.callId,
							callUUID: voipPushData.callUUID,
							host: voipPushData.host
						})
					);
					console.log('[VoIP][iOS] Dispatched voipCallOpen action from live listener');
				}
			} else {
				console.log('[VoIP][iOS] Live answer UUID mismatch. Answer:', callUUID, 'VoIP:', voipPushData?.callUUID);
			}
		});

		const initialEvents = await RNCallKeep.getInitialEvents();
		console.log('[VoIP][iOS] Initial events:', JSON.stringify(initialEvents, null, 2));

		for (const event of initialEvents) {
			const { name, data } = event;

			if (name === 'RNCallKeepPerformAnswerCallAction') {
				const { callUUID } = data;
				console.log('[VoIP][iOS] Found ANSWER event:', callUUID);

				if (voipPushData && voipPushData.callUUID.toLowerCase() === callUUID.toLowerCase()) {
					console.log('[VoIP][iOS] Matched answer to VoIP call:', voipPushData);

					if (voipPushData.host) {
						store.dispatch(
							voipCallOpen({
								callId: voipPushData.callId,
								callUUID: voipPushData.callUUID,
								host: voipPushData.host
							})
						);
						console.log('[VoIP][iOS] Dispatched voipCallOpen action');

						RNCallKeep.clearInitialEvents();
						return true;
					}
				} else {
					console.log('[VoIP][iOS] Answer event UUID does not match VoIP push UUID');
				}
			}
		}

		if (initialEvents.length > 0) {
			RNCallKeep.clearInitialEvents();
		}

		return false;
	} catch (error) {
		console.error('[VoIP][iOS] Error:', error);
		return false;
	}
};

/**
 * Android-specific implementation using native module to retrieve VoIP call data
 */
const getInitialEventsAndroid = async (): Promise<boolean> => {
	try {
		// Check for pending VoIP call from native module
		if (!NativeVoipModule) {
			console.log('[VoIP][Android] Native VoIP module not available');
			return false;
		}

		const pendingCallJson = await NativeVoipModule.getPendingVoipCall();
		if (!pendingCallJson) {
			console.log('[VoIP][Android] No pending VoIP call');
			return false;
		}

		await NativeVoipModule.clearPendingVoipCall();

		console.log('[VoIP][Android] Found pending VoIP call:', pendingCallJson);

		const pendingCall = JSON.parse(pendingCallJson) as {
			notificationType: string;
			callId: string;
			callUUID: string;
			host: string;
			event: string;
		};

		// Only handle 'accept' events
		if (pendingCall.event !== 'accept') {
			console.log('[VoIP][Android] Pending call event is not accept:', pendingCall.event);
			return false;
		}

		if (!pendingCall.callId || !pendingCall.host) {
			console.log('[VoIP][Android] Missing required call data');
			return false;
		}

		useCallStore.getState().setCallUUID(pendingCall.callUUID);

		store.dispatch(
			voipCallOpen({
				callId: pendingCall.callId,
				callUUID: pendingCall.callUUID,
				host: pendingCall.host
			})
		);

		return true;
	} catch (error) {
		console.error('[VoIP][Android] Error:', error);
		return false;
	}
};
