import RNCallKeep from 'react-native-callkeep';
import { DeviceEventEmitter, NativeEventEmitter } from 'react-native';

import { isIOS, normalizeDeepLinkingServerHost } from '../../methods/helpers';
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
const EVENT_VOIP_ACCEPT_SUCCEEDED = 'VoipAcceptSucceeded';

/** True when normalized incoming host matches the active Redux workspace (no server switch needed). */
function isVoipIncomingHostCurrentWorkspace(incomingHost: string): boolean {
	const active = store.getState().server.server;
	if (!active || !incomingHost) {
		return false;
	}
	return normalizeDeepLinkingServerHost(incomingHost) === normalizeDeepLinkingServerHost(active);
}

/** Dedupe native emit + stash replay for the same failed accept. */
let lastHandledVoipAcceptFailureCallId: string | null = null;
/** Idempotent warm delivery of native accept success. */
let lastHandledVoipAcceptSucceededCallId: string | null = null;

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

function handleVoipAcceptSucceededFromNative(data: VoipPayload) {
	const { callId } = data;
	if (callId && lastHandledVoipAcceptSucceededCallId === callId) {
		return;
	}
	if (callId) {
		lastHandledVoipAcceptSucceededCallId = callId;
	}
	if (data.type !== 'incoming_call') {
		console.log(`${TAG} VoipAcceptSucceeded: not an incoming call`);
		return;
	}
	console.log(`${TAG} VoipAcceptSucceeded:`, data);
	NativeVoipModule.clearInitialEvents();
	useCallStore.getState().setNativeAcceptedCallId(data.callId);
	if (data.host && isVoipIncomingHostCurrentWorkspace(data.host)) {
		void mediaSessionInstance.syncStateSignalsAfterNativeVoipAccept().catch(error => {
			console.error(`${TAG} syncStateSignalsAfterNativeVoipAccept failed:`, error);
		});
		return;
	}
	store.dispatch(
		deepLinkingOpen({
			callId: data.callId,
			host: data.host
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

		subscriptions.push(
			RNCallKeep.addEventListener('didPerformSetMutedCallAction', ({ muted, callUUID }) => {
				const { call, callId, nativeAcceptedCallId, toggleMute, isMuted } = useCallStore.getState();
				const eventUuid = callUUID.toLowerCase();
				const activeUuid = (callId ?? nativeAcceptedCallId ?? '').toLowerCase();

				// No active media call or event is for another CallKit/Telecom session — drop stale closure state
				if (!call || !activeUuid || eventUuid !== activeUuid) {
					return;
				}

				// Sync mute state if it doesn't match what the OS is reporting
				if (muted !== isMuted) {
					toggleMute();
				}
			})
		);

		// Note: there is intentionally no 'answerCall' listener here.
		// VoipService.swift handles accept natively: handleObservedCallChanged detects
		// hasConnected = true and calls handleNativeAccept(), which sends the DDP accept
		// signal before JS runs. JS receives VoipAcceptSucceeded after success.
	}

	/** Tracks OS-driven hold (competing call) so we only auto-resume that path, not manual hold. */
	let wasAutoHeld = false;
	subscriptions.push(
		RNCallKeep.addEventListener('didToggleHoldCallAction', ({ hold, callUUID }) => {
			const { call, callId, nativeAcceptedCallId, isOnHold, toggleHold } = useCallStore.getState();
			const eventUuid = callUUID.toLowerCase();
			const activeUuid = (callId ?? nativeAcceptedCallId ?? '').toLowerCase();

			// No active media call or event is for another CallKit/Telecom session — drop stale closure state
			// (e.g. workspace/server switch, logout, or call ended while setupMediaCallEvents still lives on Root).
			if (!call || !activeUuid || eventUuid !== activeUuid) {
				wasAutoHeld = false;
				return;
			}

			if (hold) {
				if (!isOnHold) {
					toggleHold();
					wasAutoHeld = true;
				}
				return;
			}
			if (wasAutoHeld) {
				if (isOnHold) {
					toggleHold();
					RNCallKeep.setCurrentCallActive(callUUID);
				}
				wasAutoHeld = false;
			}
		})
	);

	subscriptions.push(
		Emitter.addListener(EVENT_VOIP_ACCEPT_SUCCEEDED, (data: VoipPayload) => {
			try {
				handleVoipAcceptSucceededFromNative(data);
			} catch (error) {
				console.error(`${TAG} Error handling VoipAcceptSucceeded:`, error);
			}
		})
	);

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
			useCallStore.getState().setNativeAcceptedCallId(initialEvents.callId);

			if (initialEvents.host && isVoipIncomingHostCurrentWorkspace(initialEvents.host)) {
				void mediaSessionInstance.syncStateSignalsAfterNativeVoipAccept().catch(error => {
					console.error(`${TAG} syncStateSignalsAfterNativeVoipAccept (initial) failed:`, error);
				});
				console.log(`${TAG} Same workspace as VoIP host; skipped deepLinkingOpen`);
				return Promise.resolve(true);
			}

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
