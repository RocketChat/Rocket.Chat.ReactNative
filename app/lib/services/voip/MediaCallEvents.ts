import { isIOS, normalizeDeepLinkingServerHost } from '../../methods/helpers';
import type { VoipPayload } from '../../../definitions/Voip';
import { registerPushToken } from '../restApi';
import { callLifecycle } from './CallLifecycle';
import { MediaCallLogger } from './MediaCallLogger';
import { mediaSessionInstance } from './MediaSessionInstance';
import { useCallStore } from './useCallStore';
import type { VoipNativeEvent } from './VoipNative';

const platform = isIOS ? 'iOS' : 'Android';
const TAG = `[MediaCallEvents][${platform}]`;
const mediaCallLogger = new MediaCallLogger();

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

/** True when normalized incoming host matches the active Redux workspace. */
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

/** No-op preserved for test backward compatibility. Dedupe sentinels now live in the VoipNative adapter. */
export function clearVoipAcceptDedupeSentinels(): void {}

/** No-op preserved for test backward compatibility. */
export function resetMediaCallEventsStateForTesting(): void {}

function handleAcceptSucceededEvent(payload: VoipPayload, adapters: MediaCallEventsAdapters, fromColdStart: boolean): boolean {
	if (payload.type !== 'incoming_call') {
		mediaCallLogger.log(`${TAG} VoipAcceptSucceeded: not an incoming call`);
		return false;
	}
	mediaCallLogger.debug(`${TAG} VoipAcceptSucceeded:`, payload);
	useCallStore.getState().setNativeAcceptedCallId(payload.callId);

	if (payload.host && isVoipIncomingHostCurrentWorkspace(payload.host, adapters.getActiveServerUrl)) {
		if (fromColdStart && !isIOS) {
			// Android cold-start same workspace: let appInit() handle the call handoff
			mediaCallLogger.log(`${TAG} Same workspace as VoIP host; continuing appInit for cold-start handoff`);
			return false;
		}
		mediaSessionInstance.applyRestStateSignals().catch(error => {
			mediaCallLogger.error(`${TAG} applyRestStateSignals failed:`, error);
		});
		return fromColdStart;
	}

	adapters.onOpenDeepLink({ callId: payload.callId, host: payload.host });
	return true;
}

function handleAcceptFailedEvent(payload: VoipPayload, adapters: MediaCallEventsAdapters): boolean {
	mediaCallLogger.debug(`${TAG} VoipAcceptFailed event:`, payload);
	adapters.onOpenDeepLink({
		host: payload.host,
		callId: payload.callId,
		username: payload.username,
		voipAcceptFailed: true
	});
	return true;
}

/**
 * Creates an event dispatcher that routes `VoipNativeEvent` values to the appropriate handler.
 * Returns true when the event indicates a cold-start VoIP path that should suppress the default
 * `appInit()` call.
 *
 * Mute and hold events delegate to `callLifecycle.toggle(kind, 'native', callUuid, targetValue)`.
 * UUID validation, idempotency, echo prevention, and wasAutoHeld state all live in CallLifecycle.
 */
export function createVoipEventDispatcher(adapters: MediaCallEventsAdapters): (e: VoipNativeEvent) => boolean {
	return function dispatchVoipNativeEvent(e: VoipNativeEvent): boolean {
		switch (e.type) {
			case 'endCall': {
				mediaCallLogger.log(`${TAG} End call event listener:`, e.callUuid);
				callLifecycle.end('remote');
				return false;
			}

			case 'mute': {
				// Pass e.muted as targetValue so CallLifecycle can honour the OS assertion
				// and skip the toggle when the store already reflects the OS state (idempotent).
				// The dispatcher guard (isMuted check) is no longer needed — lifecycle handles it.
				callLifecycle.toggle('mute', 'native', e.callUuid, e.muted);
				return false;
			}

			case 'hold': {
				// Pass e.hold as targetValue so CallLifecycle can honour the OS assertion and
				// skip the toggle when the store already reflects the OS state (idempotent).
				// Without this, redundant or late OS hold events would flip the state spuriously.
				callLifecycle.toggle('hold', 'native', e.callUuid, e.hold);
				return false;
			}

			case 'pushTokenRegistered': {
				mediaCallLogger.debug(`${TAG} Registered VoIP push token:`, e.token);
				registerPushToken().catch(error => {
					mediaCallLogger.warn(`${TAG} Failed to register push token after VoIP update:`, error);
				});
				return false;
			}

			case 'acceptSucceeded': {
				return handleAcceptSucceededEvent(e.payload, adapters, e.fromColdStart);
			}

			case 'acceptFailed': {
				return handleAcceptFailedEvent(e.payload, adapters);
			}
		}
	};
}
