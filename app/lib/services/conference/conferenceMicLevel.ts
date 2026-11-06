import { DeviceEventEmitter, type EmitterSubscription } from 'react-native';

import { isAndroid } from '~/lib/methods/helpers';
import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';

const LEVEL_EVENT = 'ConferenceMicLevel';

export const startConferenceMicLevelMonitor = async (): Promise<boolean> => {
	if (!isAndroid) {
		return false;
	}
	return (await NativeConferenceCallAndroid?.startMicLevelMonitor()) ?? false;
};

export const stopConferenceMicLevelMonitor = async (): Promise<void> => {
	if (isAndroid) {
		await NativeConferenceCallAndroid?.stopMicLevelMonitor();
	}
};

export const onConferenceMicLevel = (listener: (level: number) => void): EmitterSubscription =>
	DeviceEventEmitter.addListener(LEVEL_EVENT, listener);
