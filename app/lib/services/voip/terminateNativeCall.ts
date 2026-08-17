import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import NativeVoipModule from '../../native/NativeVoip';

export function terminateNativeCall(callId: string): void {
	try {
		RNCallKeep.endCall(callId);
	} catch {
		// CallKeep may be unavailable; still attempt to stop the Android service below
	}
	if (Platform.OS === 'android') {
		try {
			// The Telecom connection is created natively, so it must be disconnectable natively too:
			// RNCallKeep.endCall silently no-ops whenever its JS-side setup() didn't run, which strands
			// the connection in ACTIVE and makes every later incoming push get rejected as busy.
			NativeVoipModule.disconnectNativeCall(callId);
		} catch {
			// bridge unavailable pre-boot
		}
		try {
			NativeVoipModule.stopVoipCallService();
		} catch {
			// bridge unavailable pre-boot
		}
	}
}
