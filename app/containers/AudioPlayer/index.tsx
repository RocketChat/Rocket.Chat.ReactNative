import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { AVPlaybackStatus } from 'expo-av';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { useSharedValue } from 'react-native-reanimated';

import { IAttachment, IUserMessage } from '../../definitions';
import { useTheme } from '../../theme';
import { downloadMediaFile, getMediaCache } from '../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import styles from './styles';
import Seek from './Seek';
import PlaybackSpeed from './PlaybackSpeed';
import PlayButton from './PlayButton';
import audioPlayer from '../../lib/methods/audioPlayer';

interface IAudioPlayerProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	author?: IUserMessage;
	msg?: string;
	baseUrl: string;
	user: any;
}

const AudioPlayer = ({ file, author, isReply = false, baseUrl, user }: IAudioPlayerProps) => {
	const [loading, setLoading] = useState(true);
	const [paused, setPaused] = useState(true);
	const [cached, setCached] = useState(false);
	const [rate, setRate] = useState(1);

	const duration = useSharedValue(0);
	const currentTime = useSharedValue(0);

	const { colors } = useTheme();

	const audioUri = useRef<string>('');

	const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
		if (status) {
			onPlaying(status);
			handlePlaybackStatusUpdate(status);
			onEnd(status);
		}
	};

	const loadAudio = async (audio: string) => {
		await audioPlayer.loadAudio(audio);
		audioUri.current = audio;
		audioPlayer.setOnPlaybackStatusUpdate(audio, onPlaybackStatusUpdate);
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
			setRate(data.rate);
		}
	};

	const onEnd = (data: AVPlaybackStatus) => {
		if (data.isLoaded) {
			if (data.didJustFinish) {
				try {
					setPaused(true);
					currentTime.value = 0;
				} catch {
					// do nothing
				}
			}
		}
	};

	const setPosition = async (time: number) => {
		await audioPlayer.setPositionAsync(audioUri.current, time);
	};

	const getUrl = () => {
		let url = file.audio_url;
		if (url && !url.startsWith('http')) {
			url = `${baseUrl}${file.audio_url}`;
		}
		return url;
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

	const handleDownload = async () => {
		setLoading(true);
		try {
			const url = getUrl();
			if (url) {
				const audio = await downloadMediaFile({
					downloadUrl: `${url}?rc_uid=${user.id}&rc_token=${user.token}`,
					type: 'audio',
					mimeType: file.audio_type
				});
				await loadAudio(audio);
				setLoading(false);
				setCached(true);
			}
		} catch {
			setLoading(false);
			setCached(false);
		}
	};

	const handleAutoDownload = async () => {
		const url = getUrl();
		try {
			if (url) {
				const isCurrentUserAuthor = author?._id === user.id;
				const isAutoDownloadEnabled = fetchAutoDownloadEnabled('audioPreferenceDownload');
				if (isAutoDownloadEnabled || isCurrentUserAuthor) {
					await handleDownload();
					return;
				}
				setLoading(false);
				setCached(false);
			}
		} catch {
			// Do nothing
		}
	};

	const onPress = () => {
		if (loading) {
			return;
		}
		if (cached) {
			togglePlayPause();
			return;
		}
		handleDownload();
	};

	useEffect(() => {
		const handleCache = async () => {
			const cachedAudioResult = await getMediaCache({
				type: 'audio',
				mimeType: file.audio_type,
				urlToCache: getUrl()
			});
			if (cachedAudioResult?.exists) {
				await loadAudio(cachedAudioResult.uri);
				setLoading(false);
				setCached(true);
				return;
			}
			if (isReply) {
				setLoading(false);
				return;
			}
			await handleAutoDownload();
		};
		handleCache();
	}, []);

	useEffect(() => {
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwake();
		}
	}, [paused]);

	if (!baseUrl) {
		return null;
	}
	return (
		<>
			<View style={[styles.audioContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
				<PlayButton disabled={isReply} loading={loading} paused={paused} cached={cached} onPress={onPress} />
				<Seek currentTime={currentTime} duration={duration} loaded={!isReply && cached} onChangeTime={setPosition} />
				<PlaybackSpeed onChange={onChangeRate} loaded={!isReply && cached} rate={rate} />
			</View>
		</>
	);
};

export default AudioPlayer;
