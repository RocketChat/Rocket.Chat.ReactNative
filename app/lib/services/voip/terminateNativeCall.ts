import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import NativeVoipModule from '../../native/NativeVoip';

// Termination is triggered from several independent paths (useCallStore.endCall,
// acceptNativeCall, and the MediaSessionInstance event handlers), so the same
// callId arrives more than once. Bounded because the app is long-lived.
const MAX_TRACKED_CALL_IDS = 32;
const terminatedCallIds = new Set<string>();

function markTerminated(callId: string): void {
	terminatedCallIds.add(callId);
	while (terminatedCallIds.size > MAX_TRACKED_CALL_IDS) {
		const oldest = terminatedCallIds.values().next().value;
		if (oldest === undefined) {
			break;
		}
		terminatedCallIds.delete(oldest);
	}
}

export function terminateNativeCall(callId: string): void {
	if (terminatedCallIds.has(callId)) {
		return;
	}
	markTerminated(callId);

	// The native disconnect runs first: RNCallKeep.endCall removes the connection from
	// VoiceConnectionService's map, which would leave nothing for this call to find.
	if (Platform.OS === 'android') {
		try {
			NativeVoipModule.disconnectNativeCall(callId);
		} catch {
			// bridge unavailable pre-boot
		}
	}

	try {
		// No-op when the native disconnect above already tore the connection down.
		RNCallKeep.endCall(callId);
	} catch {
		// CallKeep may be unavailable; still stop the Android service below
	}

	if (Platform.OS === 'android') {
		try {
			NativeVoipModule.stopVoipCallService();
		} catch {
			// bridge unavailable pre-boot
		}
	}
}

/**
 * Clears the terminate-dedupe sentinels. Called from `resetVoipState` alongside the accept-dedupe
 * sentinels so a logout / account switch cannot leave a reused callId short-circuited here.
 */
export function clearTerminateDedupeSentinels(): void {
	terminatedCallIds.clear();
}
