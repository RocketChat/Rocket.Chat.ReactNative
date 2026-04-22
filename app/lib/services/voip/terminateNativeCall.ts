import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import NativeVoipModule from '../../native/NativeVoip';

export function terminateNativeCall(callId: string): void {
	RNCallKeep.endCall(callId);
	if (Platform.OS === 'android') {
		try {
			NativeVoipModule.stopVoipCallService();
		} catch {
			// bridge unavailable pre-boot
		}
	}
}
