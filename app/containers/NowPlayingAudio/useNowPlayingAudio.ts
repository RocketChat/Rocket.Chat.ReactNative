import { useEffect, useEffectEvent } from 'react';

import AudioManager from '~/lib/methods/AudioManager';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import { useNowPlayingAudioStore, type INowPlayingAudio } from '~/lib/methods/useNowPlayingAudioStore';
import { useFocusedRoomStore } from '~/lib/methods/useFocusedRoomStore';
import { useCallStore } from '~/lib/services/voip/useCallStore';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS } from '~/containers/AudioPlayer/constants';
import { usePlaybackClock } from '~/containers/AudioPlayer/hooks/usePlaybackClock';
import { useAudioWaveform } from '~/containers/AudioPlayer/hooks/useAudioWaveform';

export const useNowPlayingAudioPlayback = (audio: INowPlayingAudio) => {
	const [playbackSpeed] = useUserPreferences<number>(AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS[1]);
	const playbackClock = usePlaybackClock(playbackSpeed ?? AVAILABLE_SPEEDS[1]);
	const waveform = useAudioWaveform(audio.uri, true);

	const onStatus = useEffectEvent(playbackClock.onStatus);

	useEffect(() => AudioManager.subscribeToNowPlayingStatus(onStatus), []);

	useEffect(() => {
		AudioManager.setRate(audio.audioKey, playbackSpeed);
	}, [audio.audioKey, playbackSpeed]);

	const togglePlayPause = () => {
		if (audio.playing) {
			playbackClock.pause();
			AudioManager.pauseAudio();
			return;
		}
		AudioManager.playAudio(audio.audioKey);
	};

	const seek = (seconds: number) =>
		playbackClock.seek(seconds, position => AudioManager.setPositionAsync(audio.audioKey, position));

	return { position: playbackClock.position, duration: playbackClock.duration, waveform, togglePlayPause, seek };
};

export const useNowPlayingAudioActions = (audio: INowPlayingAudio) => {
	const isMasterDetail = useMasterDetail();

	const close = () => AudioManager.closeAudio();

	const openSourceRoom = () => goRoom({ item: { rid: audio.rid }, isMasterDetail, jumpToMessageId: audio.msgId });

	return { close, openSourceRoom };
};

export const useNowPlayingAudio = () => useNowPlayingAudioStore(state => state.audio);

export const useIsInCall = () => {
	const hasCall = useCallStore(state => !!state.call);
	const hasConferenceCall = useConferenceCallStore(state => !!state.callId);
	return hasCall || hasConferenceCall;
};

export const useIsRoomFocused = (rid: string) => useFocusedRoomStore(state => state.rid === rid);
