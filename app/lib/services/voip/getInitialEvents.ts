import RNCallKeep from 'react-native-callkeep';
import { DeviceEventEmitter, NativeEventEmitter } from 'react-native';

import { isIOS } from '../../methods/helpers';
import store from '../../store';
import { voipCallOpen } from '../../../actions/deepLinking';
import { setVoipPushToken } from './pushTokenAux';
import { useCallStore } from './useCallStore';
import { mediaSessionInstance } from './MediaSessionInstance';
import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';

/**
 * Handles initial VoIP events on app startup.
 *
 * Both platforms now use native module to retrieve pending VoIP call data.
 * iOS: VoipModule stores pending call data from PushKit callbacks
 * Android: VoipModule stores pending call data from Intent/SharedPreferences
 */
export const getInitialEvents = (): Promise<boolean> => {
	if (isIOS) {
		return getInitialEventsIOS();
	}
	return Promise.resolve(getInitialEventsAndroid());
};

const Emitter = isIOS ? new NativeEventEmitter(NativeVoipModule) : DeviceEventEmitter;

/**
 * Sets up listeners for VoIP call events from native side.
 * @returns Cleanup function to remove listeners
 */
export const setupVoipEventListeners = (): (() => void) => {
	const subscriptions: { remove: () => void }[] = [];
	const platform = isIOS ? 'iOS' : 'Android';

	// Listen for VoIP push token registration
	if (isIOS) {
		subscriptions.push(
			Emitter.addListener('VoipPushTokenRegistered', (token: string) => {
				console.log(`[VoIP][${platform}] Registered VoIP push token:`, token);
				setVoipPushToken(token);
			})
		);
	}

	// Listen for VoIP call events (when app is already running)
	subscriptions.push(
		Emitter.addListener('VoipCallAccepted', async (data: VoipPayload) => {
			try {
				console.log(`[VoIP][${platform}] Call action event:`, data);
				NativeVoipModule.clearPendingVoipCall();
				useCallStore.getState().setCallUUID(data.callUUID);
				store.dispatch(
					voipCallOpen({
						callId: data.callId,
						callUUID: data.callUUID,
						host: data.host
					})
				);
				// await mediaSessionInstance.answerCall(data.callUUID);
			} catch (error) {
				console.error(`[VoIP][${platform}] Error handling call action event:`, error);
			}
		})
	);

	// Return cleanup function
	return () => {
		subscriptions.forEach(sub => sub.remove());
	};
};

/**
 * iOS-specific implementation using native VoipModule and CallKeep.
 * The native module stores pending VoIP call data from PushKit callbacks.
 * CallKeep is still used for the CallKit UI integration.
 */
const getInitialEventsIOS = async (): Promise<boolean> => {
	try {
		// Get pending VoIP call from native module (stored by AppDelegate when VoIP push received)
		const pendingCall = NativeVoipModule.getPendingVoipCall() as VoipPayload | null;

		if (!pendingCall) {
			console.log('[VoIP][iOS] No pending VoIP call from native module');
			return false;
		}

		console.log('[VoIP][iOS] Found pending VoIP call:', pendingCall);

		if (!pendingCall.callId || !pendingCall.host) {
			console.log('[VoIP][iOS] Missing required call data');
			NativeVoipModule.clearPendingVoipCall();
			RNCallKeep.clearInitialEvents();
			return false;
		}

		const initialEvents = await RNCallKeep.getInitialEvents();
		console.log('[VoIP][iOS] CallKeep initial events:', JSON.stringify(initialEvents, null, 2));

		let wasAnswered = false;
		for (const event of initialEvents) {
			const { name, data } = event;
			if (name === 'RNCallKeepPerformAnswerCallAction') {
				const { callUUID } = data;
				if (pendingCall.callUUID.toLowerCase() === callUUID.toLowerCase()) {
					wasAnswered = true;
					console.log('[VoIP][iOS] Call was already answered via CallKit');
					break;
				}
			}
		}

		if (wasAnswered) {
			useCallStore.getState().setCallUUID(pendingCall.callUUID);

			store.dispatch(
				voipCallOpen({
					callId: pendingCall.callId,
					callUUID: pendingCall.callUUID,
					host: pendingCall.host
				})
			);
			console.log('[VoIP][iOS] Dispatched voipCallOpen action');
		}

		// Clear the data
		NativeVoipModule.clearPendingVoipCall();
		if (initialEvents.length > 0) {
			RNCallKeep.clearInitialEvents();
		}

		return wasAnswered;
	} catch (error) {
		console.error('[VoIP][iOS] Error:', error);
		return false;
	}
};

/**
 * Android-specific implementation using native module to retrieve VoIP call data
 */
const getInitialEventsAndroid = (): boolean => {
	try {
		const pendingCall = NativeVoipModule.getPendingVoipCall() as VoipPayload;
		if (!pendingCall) {
			console.log('[VoIP][Android] No pending VoIP call');
			return false;
		}

		NativeVoipModule.clearPendingVoipCall();

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
