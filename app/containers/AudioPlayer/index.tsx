import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AVPlaybackStatus } from 'expo-av';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../theme';
import styles from './styles';
import Seek from './Seek';
import PlaybackSpeed from './PlaybackSpeed';
import PlayButton, { TAudioState } from './PlayButton';
import audioPlayer from '../../lib/methods/audioPlayer';
import { AVAILABLE_SPEEDS } from './constants';

interface IAudioPlayerProps {
	fileUri: string;
	loading: boolean;
	isReadyToPlay: boolean;
	disabled?: boolean;
	onPlayButtonPressCallback?: Function;
}

const AudioPlayer = ({
	fileUri,
	disabled = false,
	loading = true,
	isReadyToPlay = false,
	onPlayButtonPressCallback = () => {}
}: IAudioPlayerProps) => {
	const [paused, setPaused] = useState(true);
	const [rateIndex, setRateIndex] = useState(0);
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
			setRateIndex(AVAILABLE_SPEEDS.indexOf(data.rate));
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

	const onChangeRate = async (value = 1.0) => {
		await audioPlayer.setRateAsync(audioUri.current, value);
	};

	const onPress = () => {
		onPlayButtonPressCallback();
		if (loading) {
			return;
		}
		if (isReadyToPlay) {
			togglePlayPause();
		}
	};

	useEffect(() => {
		const loadAudio = async (audio: string) => {
			await audioPlayer.loadAudio(audio);
			audioUri.current = audio;
			audioPlayer.setOnPlaybackStatusUpdate(audio, onPlaybackStatusUpdate);
		};
		loadAudio(fileUri);
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
	if (loading) {
		audioState = 'loading';
	}
	if (isReadyToPlay && paused) {
		audioState = 'paused';
	}
	if (isReadyToPlay && !paused) {
		audioState = 'playing';
	}

	return (
		<View style={[styles.audioContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
			<PlayButton disabled={disabled} audioState={audioState} onPress={onPress} />
			<Seek currentTime={currentTime} duration={duration} loaded={!disabled && isReadyToPlay} onChangeTime={setPosition} />
			<PlaybackSpeed onChange={onChangeRate} loaded={!disabled && isReadyToPlay} rateIndex={rateIndex} />
		</View>
	);
};

export default AudioPlayer;
