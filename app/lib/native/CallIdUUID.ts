import { NativeModules, Platform } from 'react-native';

interface ICallIdUUIDModule {
	toUUID(callId: string): string;
}

const { CallIdUUID } = NativeModules;

/**
 * Native module to convert a callId string to a deterministic UUID v5.
 * This is used by CallKit which requires UUIDs, while the server sends random callId strings.
 * The same UUID v5 algorithm is used in both native (AppDelegate) and JS for consistency.
 */
export const CallIdUUIDModule: ICallIdUUIDModule = {
	toUUID: (callId: string): string => {
		if (Platform.OS !== 'ios') {
			// Android doesn't use CallKit, return the callId as-is or implement Android equivalent
			return callId;
		}
		return CallIdUUID.toUUID(callId);
	}
};
