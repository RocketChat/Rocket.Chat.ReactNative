import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useNavigation } from '@react-navigation/native';
import type { AudioStatus } from 'expo-audio';

import AudioControls from './AudioControls';
import AudioManager from '~/lib/methods/AudioManager';
import { AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS } from './constants';
import { type TDownloadState } from '~/lib/methods/handleMediaDownload';
import { type TAudioState } from './types';
import { useUserPreferences } from '~/lib/methods/userPreferences';
import log from '~/lib/methods/helpers/log';
import { usePlaybackClock } from './hooks/usePlaybackClock';
import { useAudioWaveform } from './hooks/useAudioWaveform';

interface IAudioPlayerProps {
	fileUri: string;
	disabled?: boolean;
	onPlayButtonPress?: Function;
	downloadState: TDownloadState;
	rid: string;
	// It's optional when comes from MessagesView
	msgId?: string;
	isRecordingPreview?: boolean;
}

const AudioPlayer = ({
	fileUri,
	disabled = false,
	onPlayButtonPress = () => {},
	downloadState,
	msgId,
	rid,
	isRecordingPreview = false
}: IAudioPlayerProps) => {
	const isLoading = downloadState === 'loading';
	const isDownloaded = downloadState === 'downloaded';

	const [playbackSpeed] = useUserPreferences<number>(AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS[1]);
	const [paused, setPaused] = useState(true);
	const playbackClock = usePlaybackClock(playbackSpeed ?? AVAILABLE_SPEEDS[1]);
	const waveform = useAudioWaveform(fileUri, isDownloaded);
	const audioUri = useRef<string>('');
	const navigation = useNavigation();

	const onPlaybackStatusUpdate = (status: AudioStatus): void => {
		if (status) {
			onPlaying(status);
			playbackClock.onStatus(status);
			onEnd(status);
		}
	};

	const onPlaying = (data: AudioStatus): void => {
		if (data.isLoaded && data.playing) {
			setPaused(false);
		} else {
			setPaused(true);
		}
	};

	const onEnd = (data: AudioStatus) => {
		if (data.isLoaded && data.didJustFinish) {
			try {
				setPaused(true);
				AudioManager.setPositionAsync(audioUri.current, 0).catch(log);
			} catch (error) {
				log(error);
			}
		}
	};

	const setPosition = (time: number) =>
		playbackClock.seek(time, seconds => AudioManager.setPositionAsync(audioUri.current, seconds));

	const togglePlayPause = async () => {
		try {
			if (!paused) {
				playbackClock.pause();
				await AudioManager.pauseAudio();
			} else {
				await AudioManager.playAudio(audioUri.current);
			}
		} catch {
			// Do nothing
		}
	};

	useEffect(() => {
		AudioManager.setRate(audioUri.current, playbackSpeed);
	}, [playbackSpeed]);

	const onPress = () => {
		onPlayButtonPress();
		if (isLoading) {
			return;
		}
		if (isDownloaded) {
			togglePlayPause();
		}
	};

	const onStatusUpdate = useEffectEvent(onPlaybackStatusUpdate);

	const listenToAudio = useEffectEvent(() => {
		AudioManager.setOnPlaybackStatusUpdate(audioUri.current, onStatusUpdate);
		AudioManager.setRate(audioUri.current, playbackSpeed);
	});

	useEffect(() => {
		if (fileUri && isDownloaded) {
			const immediate = setImmediate(() => {
				try {
					audioUri.current = AudioManager.loadAudio({ msgId, rid, uri: fileUri, isRecordingPreview });
					if (navigation.isFocused()) {
						AudioManager.addAudioRendered(audioUri.current);
					}
					listenToAudio();
				} catch {
					// do nothing
				}
			});
			return () => clearImmediate(immediate);
		}
	}, [fileUri, isDownloaded, msgId, rid, isRecordingPreview, navigation]);

	useEffect(() => {
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwake();
		}
	}, [paused]);

	useEffect(() => {
		const unsubscribeFocus = navigation.addListener('focus', () => {
			AudioManager.setOnPlaybackStatusUpdate(audioUri.current, onStatusUpdate);
			AudioManager.addAudioRendered(audioUri.current);
		});
		const pauseRecordingPreview = () => {
			if (isRecordingPreview) {
				AudioManager.pauseAudioIfPlaying(audioUri.current);
			}
		};
		const unsubscribeBlur = navigation.addListener('blur', () => {
			AudioManager.removeAudioRendered(audioUri.current);
			pauseRecordingPreview();
		});

		return () => {
			unsubscribeFocus();
			unsubscribeBlur();
			pauseRecordingPreview();
		};
	}, [navigation, isRecordingPreview]);

	let audioState: TAudioState = 'to-download';
	if (isLoading) {
		audioState = 'loading';
	}
	if (isDownloaded && paused) {
		audioState = 'paused';
	}
	if (isDownloaded && !paused) {
		audioState = 'playing';
	}

	return (
		<AudioControls
			audioState={audioState}
			disabled={disabled}
			loaded={!disabled && isDownloaded}
			currentTime={playbackClock.position}
			duration={playbackClock.duration}
			peaks={waveform}
			onPlayPress={onPress}
			onSeek={setPosition}
		/>
	);
};

export default AudioPlayer;
