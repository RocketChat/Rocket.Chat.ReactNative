import type { VideoTrack } from '@livekit/react-native';
import { startIOSPIP } from '@livekit/react-native-webrtc';
import { type ComponentRef, createRef } from 'react';
import { DeviceEventEmitter, type EmitterSubscription } from 'react-native';

import { isAndroid, isIOS } from '~/lib/methods/helpers';
import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';

const MODE_CHANGED_EVENT = 'ConferencePictureInPictureChanged';

export const iosPictureInPictureSourceRef = createRef<ComponentRef<typeof VideoTrack>>();

export const setConferencePictureInPictureEnabled = (enabled: boolean): void => {
	if (isAndroid) {
		NativeConferenceCallAndroid?.setPictureInPictureEnabled(enabled);
	}
};

export const onConferencePictureInPictureChanged = (listener: (inPictureInPicture: boolean) => void): EmitterSubscription =>
	DeviceEventEmitter.addListener(MODE_CHANGED_EVENT, listener);

export const enterConferencePictureInPicture = async (): Promise<boolean> => {
	if (isIOS) {
		if (!iosPictureInPictureSourceRef.current) {
			return false;
		}
		startIOSPIP(iosPictureInPictureSourceRef);
		return true;
	}
	return (await NativeConferenceCallAndroid?.enterPictureInPicture()) ?? false;
};
