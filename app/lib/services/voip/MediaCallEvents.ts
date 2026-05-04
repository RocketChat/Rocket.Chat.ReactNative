import RNCallKeep from 'react-native-callkeep';
import { AppState, DeviceEventEmitter, NativeEventEmitter } from 'react-native';

import { isIOS, normalizeDeepLinkingServerHost } from '../../methods/helpers';
import { useCallStore } from './useCallStore';
import { mediaSessionInstance } from './MediaSessionInstance';
import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import { registerPushToken } from '../restApi';
import { MediaCallLogger } from './MediaCallLogger';
import { voipDebugLog } from './voipDebugLogger';
import { logVoipLoginElapsed, markVoipReconnectStart } from './voipReconnectTiming';
import sdk from '../sdk';
import { store } from '../../store/auxStore';
import { disconnect as disconnectAction } from '../../../actions/connect';

const Emitter = isIOS ? new NativeEventEmitter(NativeVoipModule) : DeviceEventEmitter;
const platform = isIOS ? 'iOS' : 'Android';
const TAG = `[MediaCallEvents][${platform}]`;
const mediaCallLogger = new MediaCallLogger();

const EVENT_VOIP_ACCEPT_FAILED = 'VoipAcceptFailed';
const EVENT_VOIP_ACCEPT_SUCCEEDED = 'VoipAcceptSucceeded';
const EVENT_VOIP_COMMUNICATION_DEVICE_CHANGED = 'VoipCommunicationDeviceChanged';

/** Params forwarded into the app deep-linking pipeline for VoIP-driven navigation. */
export type VoipDeepLinkParams = {
	host?: string;
	callId?: string;
	username?: string;
	voipAcceptFailed?: boolean;
};

export type MediaCallEventsAdapters = {
	getActiveServerUrl: () => string | null | undefined;
	onOpenDeepLink: (params: VoipDeepLinkParams) => void;
};

/** True when normalized incoming host matches the active Redux workspace (no server switch needed). */
function isVoipIncomingHostCurrentWorkspace(
	incomingHost: string,
	getActiveServerUrl: MediaCallEventsAdapters['getActiveServerUrl']
): boolean {
	const active = getActiveServerUrl();
	if (!active || !incomingHost) {
		return false;
	}
	return normalizeDeepLinkingServerHost(incomingHost) === normalizeDeepLinkingServerHost(active);
}

/** Dedupe native emit + stash replay for the same failed accept. */
let lastHandledVoipAcceptFailureCallId: string | null = null;
/** Idempotent warm delivery of native accept success. */
let lastHandledVoipAcceptSucceededCallId: string | null = null;

export function clearVoipAcceptDedupeSentinels(): void {
	lastHandledVoipAcceptFailureCallId = null;
	lastHandledVoipAcceptSucceededCallId = null;
}

/** Exported for tests only. Clears accept-dedupe sentinels between test cases. Production code calls clearVoipAcceptDedupeSentinels() directly. */
export function resetMediaCallEventsStateForTesting(): void {
	clearVoipAcceptDedupeSentinels();
}

function dispatchVoipAcceptFailureFromNative(
	raw: VoipPayload & { voipAcceptFailed?: boolean },
	onOpenDeepLink: MediaCallEventsAdapters['onOpenDeepLink']
) {
	if (!raw.voipAcceptFailed) {
		return;
	}
	const { callId } = raw;
	if (callId && lastHandledVoipAcceptFailureCallId === callId) {
		return;
	}
	lastHandledVoipAcceptFailureCallId = callId ?? null;
	onOpenDeepLink({
		host: raw.host,
		callId: raw.callId,
		username: raw.username,
		voipAcceptFailed: true
	});
}

function handleVoipAcceptSucceededFromNative(data: VoipPayload, adapters: MediaCallEventsAdapters) {
	const { callId } = data;
	voipDebugLog('VoipAcceptSucceeded', 'enter', { callId, type: data.type, host: data.host });
	if (callId && lastHandledVoipAcceptSucceededCallId === callId) {
		voipDebugLog('VoipAcceptSucceeded', 'dedup hit');
		return;
	}
	if (data.type !== 'incoming_call') {
		mediaCallLogger.log(`${TAG} VoipAcceptSucceeded: not an incoming call`);
		return;
	}
	if (callId) {
		lastHandledVoipAcceptSucceededCallId = callId;
	}
	mediaCallLogger.debug(`${TAG} VoipAcceptSucceeded:`, data);
	NativeVoipModule.clearInitialEvents();
	useCallStore.getState().setNativeAcceptedCallId(data.callId);
	if (data.host && isVoipIncomingHostCurrentWorkspace(data.host, adapters.getActiveServerUrl)) {
		// Foreground accept (AppState 'active'): JS runtime never suspended, socket fresh.
		// Background/locked accept: iOS suspended TCP → socket may be zombie. Force reconnect
		// before WebRTC needs to send answer SDP. Otherwise peer times out at ~10s.
		const appState = AppState.currentState;
		const forceReconnect = appState !== 'active';
		voipDebugLog('VoipAcceptSucceeded', 'reconnect decision', { appState, forceReconnect });
		markVoipReconnectStart(forceReconnect);

		if (forceReconnect) {
			// connectedListener (connect.ts:113) early-returns if redux meteor.connected is still true.
			// Force redux flip so loginRequest fires on the new 'connected' event.
			store.dispatch(disconnectAction());
			(async () => {
				try {
					const driver = await (sdk.current as any)?.socket;
					const ddpSocket = driver?.ddp;
					try {
						ddpSocket?.connection?.close();
						voipDebugLog('VoipAcceptSucceeded', 'forced ws close');
					} catch (e) {
						voipDebugLog('VoipAcceptSucceeded', 'forced ws close threw', String(e));
					}
					sdk.current?.checkAndReopen?.();
					voipDebugLog('VoipAcceptSucceeded', 'checkAndReopen kicked');
					ddpSocket?.once?.('login', () => {
						logVoipLoginElapsed();
					});
				} catch (e) {
					voipDebugLog('VoipAcceptSucceeded', 'force reconnect threw', String(e));
				}
			})();
		}

		voipDebugLog('VoipAcceptSucceeded', 'same workspace -> applyRestStateSignals');
		mediaSessionInstance.applyRestStateSignals().catch(error => {
			voipDebugLog('VoipAcceptSucceeded', 'applyRestStateSignals failed', String(error));
			mediaCallLogger.error(`${TAG} applyRestStateSignals failed:`, error);
		});
		return;
	}
	voipDebugLog('VoipAcceptSucceeded', 'different workspace -> deeplink');
	adapters.onOpenDeepLink({
		callId: data.callId,
		host: data.host
	});
}

/**
 * Sets up listeners for media call events.
 * @returns Cleanup function to remove listeners
 */
export const setupMediaCallEvents = (adapters: MediaCallEventsAdapters): (() => void) => {
	const subscriptions: { remove: () => void }[] = [];

	// iOS listens for VoIP push token registration and CallKeep events
	if (isIOS) {
		subscriptions.push(
			Emitter.addListener('VoipPushTokenRegistered', ({ token }: { token: string }) => {
				voipDebugLog('VoipPushTokenRegistered', 'received', { token });
				mediaCallLogger.debug(`${TAG} Registered VoIP push token:`, token);
				registerPushToken()
					.then(() => voipDebugLog('VoipPushTokenRegistered', 'registerPushToken resolved'))
					.catch(error => {
						voipDebugLog('VoipPushTokenRegistered', 'registerPushToken rejected', String(error));
						mediaCallLogger.warn(`${TAG} Failed to register push token after VoIP update:`, error);
					});
			})
		);

		subscriptions.push(
			RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
				mediaCallLogger.log(`${TAG} End call event listener:`, callUUID);
				clearVoipAcceptDedupeSentinels();
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

	if (!isIOS) {
		subscriptions.push(
			Emitter.addListener(EVENT_VOIP_COMMUNICATION_DEVICE_CHANGED, ({ isSpeaker }: { isSpeaker: boolean }) => {
				if (useCallStore.getState().call == null) return;
				useCallStore.setState({ isSpeakerOn: isSpeaker });
			})
		);
	}

	subscriptions.push(
		Emitter.addListener(EVENT_VOIP_ACCEPT_SUCCEEDED, (data: VoipPayload) => {
			try {
				handleVoipAcceptSucceededFromNative(data, adapters);
			} catch (error) {
				mediaCallLogger.error(`${TAG} Error handling VoipAcceptSucceeded:`, error);
			}
		})
	);

	subscriptions.push(
		Emitter.addListener(EVENT_VOIP_ACCEPT_FAILED, (data: VoipPayload & { voipAcceptFailed?: boolean }) => {
			mediaCallLogger.debug(`${TAG} VoipAcceptFailed event:`, data);
			dispatchVoipAcceptFailureFromNative({ ...data, voipAcceptFailed: true }, adapters.onOpenDeepLink);
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
export const getInitialMediaCallEvents = async (adapters: MediaCallEventsAdapters): Promise<boolean> => {
	voipDebugLog('getInitialMediaCallEvents', 'enter');
	try {
		const initialEvents = NativeVoipModule.getInitialEvents() as (VoipPayload & { voipAcceptFailed?: boolean }) | null;
		voipDebugLog('getInitialMediaCallEvents', 'initial', initialEvents ?? null);
		if (!initialEvents) {
			mediaCallLogger.log(`${TAG} No initial events from native module`);
			RNCallKeep.clearInitialEvents();
			return false;
		}
		mediaCallLogger.debug(`${TAG} Found initial events:`, initialEvents);

		if (initialEvents.voipAcceptFailed && initialEvents.callId && initialEvents.host) {
			dispatchVoipAcceptFailureFromNative(initialEvents, adapters.onOpenDeepLink);
			RNCallKeep.clearInitialEvents();
			NativeVoipModule.clearInitialEvents();
			// Avoid racing `appInit()` with the deep-linking saga that handles the failure
			return true;
		}

		if (!initialEvents.callId || !initialEvents.host || initialEvents.type !== 'incoming_call') {
			mediaCallLogger.log(`${TAG} Missing required call data`);
			RNCallKeep.clearInitialEvents();
			return false;
		}

		let wasAnswered = false;

		// iOS loops through the events and checks if the call was already answered
		if (isIOS) {
			const callKeepInitialEvents = await RNCallKeep.getInitialEvents();
			RNCallKeep.clearInitialEvents();
			mediaCallLogger.debug(`${TAG} CallKeep initial events:`, JSON.stringify(callKeepInitialEvents, null, 2));

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

			if (initialEvents.host && isVoipIncomingHostCurrentWorkspace(initialEvents.host, adapters.getActiveServerUrl)) {
				if (!isIOS) {
					mediaCallLogger.log(`${TAG} Same workspace as VoIP host; continuing appInit for cold-start handoff`);
					return false;
				}
				mediaSessionInstance.applyRestStateSignals().catch(error => {
					mediaCallLogger.error(`${TAG} applyRestStateSignals (initial) failed:`, error);
				});
				mediaCallLogger.log(`${TAG} Same workspace as VoIP host; skipped deepLinkingOpen`);
				return true;
			}

			adapters.onOpenDeepLink({
				callId: initialEvents.callId,
				host: initialEvents.host
			});
			mediaCallLogger.log(`${TAG} Dispatched deepLinkingOpen for VoIP`);
		}

		return wasAnswered;
	} catch (error) {
		mediaCallLogger.error(`${TAG} Error:`, error);
		return false;
	}
};
