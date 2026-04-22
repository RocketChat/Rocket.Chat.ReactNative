import RNCallKeep from 'react-native-callkeep';

import { isAndroid } from '../../methods/helpers';
import NativeVoipModule from '../../native/NativeVoip';

export function terminateNativeCall(callId: string): void {
	RNCallKeep.endCall(callId);
	if (isAndroid) {
		try {
			NativeVoipModule.stopVoipCallService();
		} catch {
			// bridge unavailable pre-boot
		}
	}
}
