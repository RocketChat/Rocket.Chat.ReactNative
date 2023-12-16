import React, { useEffect, useRef, useState } from 'react';
import { InteractionManager, View } from 'react-native';
import { AVPlaybackStatus } from 'expo-av';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme';
import styles from './styles';
import Seek from './Seek';
import PlaybackSpeed from './PlaybackSpeed';
import PlayButton from './PlayButton';
import audioPlayer from '../../lib/methods/audioPlayer';
import { AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS } from './constants';
import { TDownloadState } from '../../lib/methods/handleMediaDownload';
import { TAudioState } from './types';
import { useUserPreferences } from '../../lib/methods';

interface IAudioPlayerProps {
	fileUri: string;
	disabled?: boolean;
	onPlayButtonPress?: Function;
	downloadState: TDownloadState;
	rid: string;
	// It's optional when comes from MessagesView
	msgId?: string;
}

const AudioPlayer = ({
	fileUri,
	disabled = false,
	onPlayButtonPress = () => {},
	downloadState,
	msgId,
	rid
}: IAudioPlayerProps) => {
	const isLoading = downloadState === 'loading';
	const isDownloaded = downloadState === 'downloaded';

	const [playbackSpeed] = useUserPreferences<number>(AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS[1]);
	const [paused, setPaused] = useState(true);
	const duration = useSharedValue(0);
	const currentTime = useSharedValue(0);
	const { colors } = useTheme();
	const audioUri = useRef<string>('');
	const navigation = useNavigation();

	const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
		if (status) {
			onPlaying(status);
			handlePlaybackStatusUpdate(status);
			onEnd(status);
		}
	};

	const onPlaying = (data: AVPlaybackStatus) => {
		if (data.isLoaded && data.isPlaying) {
			setPaused(false);
		} else {
			setPaused(true);
		}
	};

	const handlePlaybackStatusUpdate = (data: AVPlaybackStatus) => {
		if (data.isLoaded && data.durationMillis) {
			const durationSeconds = data.durationMillis / 1000;
			duration.value = durationSeconds > 0 ? durationSeconds : 0;
			const currentSecond = data.positionMillis / 1000;
			if (currentSecond <= durationSeconds) {
				currentTime.value = currentSecond;
			}
		}
	};

	const onEnd = (data: AVPlaybackStatus) => {
		if (data.isLoaded && data.didJustFinish) {
			try {
				setPaused(true);
				currentTime.value = 0;
			} catch {
				// do nothing
			}
		}
	};

	const setPosition = async (time: number) => {
		await audioPlayer.setPositionAsync(audioUri.current, time);
	};

	const togglePlayPause = async () => {
		try {
			if (!paused) {
				await audioPlayer.pauseAudio(audioUri.current);
			} else {
				await audioPlayer.playAudio(audioUri.current);
			}
		} catch {
			// Do nothing
		}
	};

	useEffect(() => {
		audioPlayer.setRateAsync(audioUri.current, playbackSpeed);
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

	useEffect(() => {
		InteractionManager.runAfterInteractions(async () => {
			audioUri.current = await audioPlayer.loadAudio({ msgId, rid, uri: fileUri });
			audioPlayer.setOnPlaybackStatusUpdate(audioUri.current, onPlaybackStatusUpdate);
			audioPlayer.setRateAsync(audioUri.current, playbackSpeed);
		});
	}, [fileUri]);

	useEffect(() => {
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwake();
		}
	}, [paused]);

	useEffect(() => {
		const unsubscribeFocus = navigation.addListener('focus', () => {
			audioPlayer.setOnPlaybackStatusUpdate(audioUri.current, onPlaybackStatusUpdate);
		});

		return () => {
			unsubscribeFocus();
		};
	}, [navigation]);

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
		<View style={[styles.audioContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
			<PlayButton disabled={disabled} audioState={audioState} onPress={onPress} />
			<Seek currentTime={currentTime} duration={duration} loaded={!disabled && isDownloaded} onChangeTime={setPosition} />
			{audioState === 'playing' ? <PlaybackSpeed audioState={audioState} /> : null}
		</View>
	);
};

export default AudioPlayer;
