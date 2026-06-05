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
			NativeVoipModule.stopVoipCallService();
		} catch {
			// bridge unavailable pre-boot
		}
	}
}
