import RNCallKeep from 'react-native-callkeep';
import { DeviceEventEmitter, NativeEventEmitter } from 'react-native';

import { isIOS } from '../../methods/helpers';
import store from '../../store';
import { deepLinkingOpen } from '../../../actions/deepLinking';
import { useCallStore } from './useCallStore';
import { mediaSessionInstance } from './MediaSessionInstance';
import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import { registerPushToken } from '../restApi';

const Emitter = isIOS ? new NativeEventEmitter(NativeVoipModule) : DeviceEventEmitter;
const platform = isIOS ? 'iOS' : 'Android';
const TAG = `[MediaCallEvents][${platform}]`;

const EVENT_VOIP_ACCEPT_FAILED = 'VoipAcceptFailed';

/** Dedupe native emit + stash replay for the same failed accept. */
let lastHandledVoipAcceptFailureCallId: string | null = null;

function dispatchVoipAcceptFailureFromNative(raw: VoipPayload & { voipAcceptFailed?: boolean }) {
	if (!raw.voipAcceptFailed) {
		return;
	}
	const { callId } = raw;
	if (callId && lastHandledVoipAcceptFailureCallId === callId) {
		return;
	}
	lastHandledVoipAcceptFailureCallId = callId;
	store.dispatch(
		deepLinkingOpen({
			host: raw.host,
			callId: raw.callId,
			username: raw.username,
			voipAcceptFailed: true
		})
	);
}

/**
 * Sets up listeners for media call events.
 * @returns Cleanup function to remove listeners
 */
export const setupMediaCallEvents = (): (() => void) => {
	const subscriptions: { remove: () => void }[] = [];

	// iOS listens for VoIP push token registration and CallKeep events
	if (isIOS) {
		subscriptions.push(
			Emitter.addListener('VoipPushTokenRegistered', ({ token }: { token: string }) => {
				console.log(`${TAG} Registered VoIP push token:`, token);
				registerPushToken().catch(error => {
					console.log(`${TAG} Failed to register push token after VoIP update:`, error);
				});
			})
		);

		subscriptions.push(
			RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
				console.log(`${TAG} End call event listener:`, callUUID);
				mediaSessionInstance.endCall(callUUID);
			})
		);

		// Note: there is intentionally no 'answerCall' listener here.
		// VoipService.swift handles accept natively: handleObservedCallChanged detects
		// hasConnected = true and calls handleNativeAccept(), which sends the DDP accept
		// signal before JS runs. JS only reads the stored initialEventsData payload after the fact.
	} else {
		// Android listens for media call events from VoipModule
		subscriptions.push(
			Emitter.addListener('VoipPushInitialEvents', async (data: VoipPayload & { voipAcceptFailed?: boolean }) => {
				try {
					if (data.voipAcceptFailed) {
						console.log(`${TAG} Accept failed initial event`);
						dispatchVoipAcceptFailureFromNative(data);
						NativeVoipModule.clearInitialEvents();
						return;
					}
					if (data.type !== 'incoming_call') {
						console.log(`${TAG} Not an incoming call`);
						return;
					}
					console.log(`${TAG} Initial events event:`, data);
					NativeVoipModule.clearInitialEvents();
					useCallStore.getState().setCallId(data.callId);
					store.dispatch(
						deepLinkingOpen({
							callId: data.callId,
							host: data.host
						})
					);
					// await mediaSessionInstance.answerCall(data.callId);
				} catch (error) {
					console.error(`${TAG} Error handling initial events event:`, error);
				}
			})
		);
	}

	subscriptions.push(
		Emitter.addListener(EVENT_VOIP_ACCEPT_FAILED, (data: VoipPayload & { voipAcceptFailed?: boolean }) => {
			console.log(`${TAG} VoipAcceptFailed event:`, data);
			dispatchVoipAcceptFailureFromNative({ ...data, voipAcceptFailed: true });
			NativeVoipModule.clearInitialEvents();
		})
	);

	return () => {
		subscriptions.forEach(sub => sub.remove());
	};
};

/**
 * Handles initial media call events (cold start).
 * @returns true if startup should skip the default `appInit()` path (answered call, or accept failure handed to deep linking)
 */
export const getInitialMediaCallEvents = async (): Promise<boolean> => {
	try {
		const initialEvents = NativeVoipModule.getInitialEvents() as (VoipPayload & { voipAcceptFailed?: boolean }) | null;
		if (!initialEvents) {
			console.log(`${TAG} No initial events from native module`);
			RNCallKeep.clearInitialEvents();
			return false;
		}
		console.log(`${TAG} Found initial events:`, initialEvents);

		if (initialEvents.voipAcceptFailed && initialEvents.callId && initialEvents.host) {
			dispatchVoipAcceptFailureFromNative(initialEvents);
			RNCallKeep.clearInitialEvents();
			NativeVoipModule.clearInitialEvents();
			// Avoid racing `appInit()` with the deep-linking saga that handles the failure
			return true;
		}

		if (!initialEvents.callId || !initialEvents.host || initialEvents.type !== 'incoming_call') {
			console.log(`${TAG} Missing required call data`);
			RNCallKeep.clearInitialEvents();
			return false;
		}

		let wasAnswered = false;

		// iOS loops through the events and checks if the call was already answered
		if (isIOS) {
			const callKeepInitialEvents = await RNCallKeep.getInitialEvents();
			RNCallKeep.clearInitialEvents();
			console.log(`${TAG} CallKeep initial events:`, JSON.stringify(callKeepInitialEvents, null, 2));

			for (const event of callKeepInitialEvents) {
				const { name, data } = event;
				if (name === 'RNCallKeepPerformAnswerCallAction') {
					const { callUUID } = data;
					if (initialEvents.callId === callUUID) {
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
			useCallStore.getState().setCallId(initialEvents.callId);

			store.dispatch(
				deepLinkingOpen({
					callId: initialEvents.callId,
					host: initialEvents.host
				})
			);
			console.log(`${TAG} Dispatched deepLinkingOpen for VoIP`);
		}

		return Promise.resolve(wasAnswered);
	} catch (error) {
		console.error(`${TAG} Error:`, error);
		return false;
	}
};
