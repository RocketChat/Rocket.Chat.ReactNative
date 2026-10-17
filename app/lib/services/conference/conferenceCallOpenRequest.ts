import { DeviceEventEmitter, type EmitterSubscription } from 'react-native';

import { isAndroid } from '~/lib/methods/helpers';
import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';

const OPEN_REQUESTED_EVENT = 'ConferenceCallOpenRequested';

export const consumeConferenceCallOpenRequest = async (): Promise<boolean> => {
	if (!isAndroid) {
		return false;
	}
	return (await NativeConferenceCallAndroid?.consumeOpenCallRequest()) ?? false;
};

export const onConferenceCallOpenRequested = (listener: () => void): EmitterSubscription =>
	DeviceEventEmitter.addListener(OPEN_REQUESTED_EVENT, listener);
