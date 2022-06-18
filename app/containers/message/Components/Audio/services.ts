import TrackPlayer, { Event, State, Capability } from 'react-native-track-player';

import { clearCurrentTrack } from './tracksStorage';

let wasPausedByDuck = false;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// eslint-disable-next-line require-await
export const playbackService = async () => {
	TrackPlayer.addEventListener(Event.RemotePause, () => {
		TrackPlayer.pause();
	});

	TrackPlayer.addEventListener(Event.RemotePlay, () => {
		TrackPlayer.play();
	});

	TrackPlayer.addEventListener(Event.RemoteStop, () => {
		clearCurrentTrack();
		TrackPlayer.destroy();
	});

	TrackPlayer.addEventListener(Event.RemoteDuck, async e => {
		if (e.permanent === true) {
			TrackPlayer.stop();
		} else if (e.paused === true) {
			const playerState = await TrackPlayer.getState();
			wasPausedByDuck = playerState !== State.Paused;
			TrackPlayer.pause();
		} else if (wasPausedByDuck === true) {
			TrackPlayer.play();
			wasPausedByDuck = false;
		}
	});
};

export const setupService = async () => {
	await TrackPlayer.setupPlayer();
	await TrackPlayer.updateOptions({
		stopWithApp: true,
		capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
		compactCapabilities: [Capability.Play, Capability.Pause]
	});
};
