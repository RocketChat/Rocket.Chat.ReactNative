import { AndroidAudioTypePresets, AudioSession, registerGlobals } from '@livekit/react-native';
import { mediaDevices } from '@livekit/react-native-webrtc';
import {
	DisconnectReason,
	isAudioTrack,
	isLocalTrack,
	isRemoteTrack,
	isVideoTrack,
	type LocalVideoTrack,
	Room,
	RoomEvent,
	Track
} from 'livekit-client';

export {
	AndroidAudioTypePresets,
	AudioSession,
	DisconnectReason,
	isAudioTrack,
	isLocalTrack,
	isRemoteTrack,
	isVideoTrack,
	mediaDevices,
	Room,
	RoomEvent,
	Track
};
export type { LocalVideoTrack };

let globalsRegistered = false;

export const registerLiveKitGlobals = (): void => {
	if (globalsRegistered) {
		return;
	}
	registerGlobals({ autoConfigureAudioSession: false });
	globalsRegistered = true;
};
