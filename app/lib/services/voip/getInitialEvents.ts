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

const Emitter = isIOS ? new NativeEventEmitter(NativeVoipModule) : DeviceEventEmitter;
const platform = isIOS ? 'iOS' : 'Android';
const TAG = `[getInitialEvents][${platform}]`;

/**
 * Sets up listeners for VoIP call events from native side.
 * @returns Cleanup function to remove listeners
 */
export const setupVoipEventListeners = (): (() => void) => {
	const subscriptions: { remove: () => void }[] = [];

	// iOS listens for VoIP push token registration and CallKeep events
	if (isIOS) {
		subscriptions.push(
			Emitter.addListener('VoipPushTokenRegistered', (token: string) => {
				console.log(`${TAG} Registered VoIP push token:`, token);
				setVoipPushToken(token);
			})
		);

		subscriptions.push(
			RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
				console.log(`${TAG} Answer call event listener:`, callUUID);
				mediaSessionInstance.answerCall(callUUID);
				NativeVoipModule.clearInitialEvents();
				RNCallKeep.clearInitialEvents();
			})
		);
		subscriptions.push(
			RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
				console.log(`${TAG} End call event listener:`, callUUID);
				mediaSessionInstance.endCall(callUUID);
			})
		);
	} else {
		// Android listens for VoIP call events from VoipModule
		subscriptions.push(
			Emitter.addListener('VoipPushInitialEvents', async (data: VoipPayload) => {
				try {
					if (data.type !== 'incoming_call') {
						console.log(`${TAG} Not an incoming call`);
						return;
					}
					console.log(`${TAG} Initial events event:`, data);
					NativeVoipModule.clearInitialEvents();
					useCallStore.getState().setCallUUID(data.callUUID);
					store.dispatch(
						voipCallOpen({
							callId: data.callId,
							callUUID: data.callUUID,
							host: data.host
						})
					);
					await mediaSessionInstance.answerCall(data.callUUID);
				} catch (error) {
					console.error(`${TAG} Error handling initial events event:`, error);
				}
			})
		);
	}

	// Return cleanup function
	return () => {
		subscriptions.forEach(sub => sub.remove());
	};
};

/**
 * Handles initial VoIP events from native module.
 * @returns true if the call was answered, false otherwise
 */
export const getInitialEvents = async (): Promise<boolean> => {
	try {
		// Get initial events from native module
		const initialEvents = NativeVoipModule.getInitialEvents() as VoipPayload | null;
		if (!initialEvents) {
			console.log(`${TAG} No initial events from native module`);
			RNCallKeep.clearInitialEvents();
			return false;
		}
		console.log(`${TAG} Found initial events:`, initialEvents);

		if (!initialEvents.callId || !initialEvents.host || initialEvents.type !== 'incoming_call') {
			console.log(`${TAG} Missing required call data`);
			RNCallKeep.clearInitialEvents();
			return false;
		}

		let wasAnswered = false;

		if (isIOS) {
			const callKeepInitialEvents = await RNCallKeep.getInitialEvents();
			RNCallKeep.clearInitialEvents();
			console.log(`${TAG} CallKeep initial events:`, JSON.stringify(callKeepInitialEvents, null, 2));

			// iOS loops through the events and checks if the call was already answered
			for (const event of callKeepInitialEvents) {
				const { name, data } = event;
				if (name === 'RNCallKeepPerformAnswerCallAction') {
					const { callUUID } = data;
					if (initialEvents.callUUID.toLowerCase() === callUUID.toLowerCase()) {
						wasAnswered = true;
						console.log(`${TAG} Call was already answered via CallKit`);
						break;
					}
				}
			}
		} else {
			// Android only sends answered event, so we can assume the call was answered
			wasAnswered = true;
		}

		if (wasAnswered) {
			useCallStore.getState().setCallUUID(initialEvents.callUUID);

			store.dispatch(
				voipCallOpen({
					callId: initialEvents.callId,
					callUUID: initialEvents.callUUID,
					host: initialEvents.host
				})
			);
			console.log(`${TAG} Dispatched voipCallOpen action`);
		}

		return Promise.resolve(wasAnswered);
	} catch (error) {
		console.error(`${TAG} Error:`, error);
		return false;
	}
};
