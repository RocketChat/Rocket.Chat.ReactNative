import TrackPlayer, { Event, State, Capability } from 'react-native-track-player';
// import type { ProgressUpdateEvent } from 'react-native-track-player';

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

	// TrackPlayer.addEventListener(Event.PlaybackQueueEnded, data => {
	// 	console.log('Event.PlaybackQueueEnded', data);
	// });

	// TrackPlayer.addEventListener(Event.PlaybackTrackChanged, data => {
	// 	console.log('Event.PlaybackTrackChanged', data);
	// });

	// TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data: ProgressUpdateEvent) => {
	// 	console.log('Event.PlaybackProgressUpdated', data);
	// });

	// TrackPlayer.addEventListener(Event.RemoteNext, () => {
	// 	TrackPlayer.skipToNext();
	// });

	// TrackPlayer.addEventListener(Event.RemotePrevious, () => {
	// 	TrackPlayer.skipToPrevious();
	// });
};

export const setupService = async () => {
	try {
		await TrackPlayer.setupPlayer();
		await TrackPlayer.updateOptions({
			stopWithApp: false,
			capabilities: [
				Capability.Play,
				Capability.Pause,
				Capability.Stop
				// Capability.SkipToNext,
				// Capability.SkipToPrevious
			],
			compactCapabilities: [
				Capability.Play,
				Capability.Pause
				// Capability.SkipToNext
			]
		});
	} catch {
		// Do nothing
	}
};
