import RNCallKeep from 'react-native-callkeep';
import { DeviceEventEmitter, NativeEventEmitter } from 'react-native';

import { isIOS, normalizeDeepLinkingServerHost } from '../../methods/helpers';
import { useCallStore } from './useCallStore';
import { mediaSessionInstance } from './MediaSessionInstance';
import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import { registerPushToken } from '../restApi';
import { MediaCallLogger } from './MediaCallLogger';

const Emitter = isIOS ? new NativeEventEmitter(NativeVoipModule) : DeviceEventEmitter;
const platform = isIOS ? 'iOS' : 'Android';
const TAG = `[MediaCallEvents][${platform}]`;
const mediaCallLogger = new MediaCallLogger();

const EVENT_VOIP_ACCEPT_FAILED = 'VoipAcceptFailed';
const EVENT_VOIP_ACCEPT_SUCCEEDED = 'VoipAcceptSucceeded';

/** Params forwarded to app-level deep linking (Redux) without importing actions here. */
export type VoipDeepLinkOpenParams = {
	host?: string;
	callId?: string;
	username?: string;
	voipAcceptFailed?: boolean;
	path?: string;
	rid?: string;
	messageId?: string;
	fullURL?: string;
	type?: string;
	token?: string;
};

export type MediaCallEventsRuntime = {
	getActiveWorkspaceServerUrl: () => string | null | undefined;
	onOpenDeepLink: (params: VoipDeepLinkOpenParams) => void;
};

/** True when normalized incoming host matches the active Redux workspace (no server switch needed). */
function isVoipIncomingHostCurrentWorkspace(runtime: MediaCallEventsRuntime, incomingHost: string): boolean {
	const active = runtime.getActiveWorkspaceServerUrl();
	if (!active || !incomingHost) {
		return false;
	}
	return normalizeDeepLinkingServerHost(incomingHost) === normalizeDeepLinkingServerHost(active);
}

/** Dedupe native emit + stash replay for the same failed accept. */
let lastHandledVoipAcceptFailureCallId: string | null = null;
/** Idempotent warm delivery of native accept success. */
let lastHandledVoipAcceptSucceededCallId: string | null = null;

/** Test helper: clears accept dedupe sentinels (Jest module state). */
export function resetMediaCallEventsStateForTesting(): void {
	lastHandledVoipAcceptFailureCallId = null;
	lastHandledVoipAcceptSucceededCallId = null;
}

function clearVoipAcceptDedupSentinels(): void {
	lastHandledVoipAcceptFailureCallId = null;
	lastHandledVoipAcceptSucceededCallId = null;
}

function dispatchVoipAcceptFailureFromNative(runtime: MediaCallEventsRuntime, raw: VoipPayload & { voipAcceptFailed?: boolean }) {
	if (!raw.voipAcceptFailed) {
		return;
	}
	const { callId } = raw;
	if (callId && lastHandledVoipAcceptFailureCallId === callId) {
		return;
	}
	if (callId) {
		lastHandledVoipAcceptFailureCallId = callId;
	}
	runtime.onOpenDeepLink({
		host: raw.host,
		callId: raw.callId,
		username: raw.username,
		voipAcceptFailed: true
	});
}

function handleVoipAcceptSucceededFromNative(runtime: MediaCallEventsRuntime, data: VoipPayload) {
	const { callId } = data;
	if (data.type !== 'incoming_call') {
		mediaCallLogger.log(`${TAG} VoipAcceptSucceeded: not an incoming call`);
		return;
	}
	if (callId && lastHandledVoipAcceptSucceededCallId === callId) {
		return;
	}
	if (data.type !== 'incoming_call') {
		mediaCallLogger.log(`${TAG} VoipAcceptSucceeded: not an incoming call`);
		return;
	}
	if (callId) {
		lastHandledVoipAcceptSucceededCallId = callId;
	}
	mediaCallLogger.log(`${TAG} VoipAcceptSucceeded:`, data);
	NativeVoipModule.clearInitialEvents();
	useCallStore.getState().setNativeAcceptedCallId(data.callId);
	if (data.host && isVoipIncomingHostCurrentWorkspace(runtime, data.host)) {
		mediaSessionInstance.applyRestStateSignals().catch(error => {
			mediaCallLogger.error(`${TAG} applyRestStateSignals failed:`, error);
		});
		return;
	}
	runtime.onOpenDeepLink({
		callId: data.callId,
		host: data.host
	});
}

/**
 * Sets up listeners for media call events.
 * @returns Cleanup function to remove listeners
 */
export const setupMediaCallEvents = (runtime: MediaCallEventsRuntime): (() => void) => {
	const subscriptions: { remove: () => void }[] = [];

	subscriptions.push(
		RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
			mediaCallLogger.log(`${TAG} End call event listener:`, callUUID);
			mediaSessionInstance.endCall(callUUID);
			clearVoipAcceptDedupSentinels();
		})
	);

	// iOS listens for VoIP push token registration and CallKeep UI actions
	if (isIOS) {
		subscriptions.push(
			Emitter.addListener('VoipPushTokenRegistered', ({ token }: { token: string }) => {
				mediaCallLogger.log(`${TAG} Registered VoIP push token:`, token);
				registerPushToken().catch(error => {
					mediaCallLogger.log(`${TAG} Failed to register push token after VoIP update:`, error);
				});
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
		// hasConnected = true and calls handleNativeAccept(), which sends the REST accept
		// (POST /api/v1/media-calls.answer) before JS runs. JS receives VoipAcceptSucceeded after success.
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
				handleVoipAcceptSucceededFromNative(runtime, data);
			} catch (error) {
				mediaCallLogger.error(`${TAG} Error handling VoipAcceptSucceeded:`, error);
			}
		})
	);

	subscriptions.push(
		Emitter.addListener(EVENT_VOIP_ACCEPT_FAILED, (data: VoipPayload & { voipAcceptFailed?: boolean }) => {
			mediaCallLogger.log(`${TAG} VoipAcceptFailed event:`, data);
			dispatchVoipAcceptFailureFromNative(runtime, { ...data, voipAcceptFailed: true });
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
export const getInitialMediaCallEvents = async (runtime: MediaCallEventsRuntime): Promise<boolean> => {
	try {
		const initialEvents = NativeVoipModule.getInitialEvents() as (VoipPayload & { voipAcceptFailed?: boolean }) | null;
		if (!initialEvents) {
			mediaCallLogger.log(`${TAG} No initial events from native module`);
			RNCallKeep.clearInitialEvents();
			return false;
		}
		mediaCallLogger.log(`${TAG} Found initial events:`, initialEvents);

		if (initialEvents.voipAcceptFailed && initialEvents.callId && initialEvents.host) {
			dispatchVoipAcceptFailureFromNative(runtime, initialEvents);
			RNCallKeep.clearInitialEvents();
			NativeVoipModule.clearInitialEvents();
			// Avoid racing `appInit()` with the deep-linking saga that handles the failure
			return true;
		}

		if (!initialEvents.callId || !initialEvents.host || initialEvents.type !== 'incoming_call') {
			mediaCallLogger.log(`${TAG} Missing required call data`);
			RNCallKeep.clearInitialEvents();
			NativeVoipModule.clearInitialEvents();
			return false;
		}

		let wasAnswered = false;

		// iOS loops through the events and checks if the call was already answered
		if (isIOS) {
			const callKeepInitialEvents = await RNCallKeep.getInitialEvents();
			RNCallKeep.clearInitialEvents();
			mediaCallLogger.log(`${TAG} CallKeep initial events:`, JSON.stringify(callKeepInitialEvents, null, 2));

			for (const event of callKeepInitialEvents) {
				const { name, data } = event;
				if (name === 'RNCallKeepPerformAnswerCallAction') {
					const { callUUID } = data;
					if (initialEvents.callId === callUUID) {
						wasAnswered = true;
						mediaCallLogger.log(`${TAG} Call was already answered via CallKit`);
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

			if (initialEvents.host && isVoipIncomingHostCurrentWorkspace(runtime, initialEvents.host)) {
				mediaSessionInstance.applyRestStateSignals().catch(error => {
					mediaCallLogger.error(`${TAG} applyRestStateSignals (initial) failed:`, error);
				});
				mediaCallLogger.log(`${TAG} Same workspace as VoIP host; skipped deep link open`);
				return true;
			}

			runtime.onOpenDeepLink({
				callId: initialEvents.callId,
				host: initialEvents.host
			});
			mediaCallLogger.log(`${TAG} Dispatched deep link open for VoIP`);
		} else if (isIOS) {
			NativeVoipModule.clearInitialEvents();
		}

		return wasAnswered;
	} catch (error) {
		mediaCallLogger.error(`${TAG} Error:`, error);
		return false;
	}
};
