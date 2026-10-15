import { AndroidAudioTypePresets, AudioSession, registerGlobals } from '@livekit/react-native';
import {
	isAudioTrack,
	isLocalTrack,
	isRemoteTrack,
	isVideoTrack,
	type LocalVideoTrack,
	Room,
	RoomEvent,
	Track
} from 'livekit-client';

export { AndroidAudioTypePresets, AudioSession, isAudioTrack, isLocalTrack, isRemoteTrack, isVideoTrack, Room, RoomEvent, Track };
export type { LocalVideoTrack };

let globalsRegistered = false;

export const registerLiveKitGlobals = (): void => {
	if (globalsRegistered) {
		return;
	}
	registerGlobals({ autoConfigureAudioSession: false });
	globalsRegistered = true;
};
