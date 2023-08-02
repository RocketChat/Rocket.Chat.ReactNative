import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, useWindowDimensions } from 'react-native';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import Slider from '@react-native-community/slider';
import moment from 'moment';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { Sound } from 'expo-av/build/Audio/Sound';

import Touchable from './Touchable';
import Markdown from '../markdown';
import { CustomIcon } from '../CustomIcon';
import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { isAndroid, isIOS } from '../../lib/methods/helpers';
import MessageContext from './Context';
import ActivityIndicator from '../ActivityIndicator';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import { useTheme } from '../../theme';
import { downloadMediaFile, getMediaCache } from '../../lib/methods/handleMediaDownload';
import EventEmitter from '../../lib/methods/helpers/events';
import { PAUSE_AUDIO } from './constants';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';

interface IButton {
	loading: boolean;
	paused: boolean;
	disabled?: boolean;
	onPress: () => void;
	cached: boolean;
}

interface IMessageAudioProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	getCustomEmoji: TGetCustomEmoji;
	author?: IUserMessage;
}

const mode = {
	allowsRecordingIOS: false,
	playsInSilentModeIOS: true,
	staysActiveInBackground: true,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: InterruptionModeIOS.DoNotMix,
	interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
};

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		borderWidth: 1,
		borderRadius: 4,
		marginBottom: 6
	},
	playPauseButton: {
		marginHorizontal: 10,
		alignItems: 'center',
		backgroundColor: 'transparent'
	},
	audioLoading: {
		marginHorizontal: 8
	},
	slider: {
		flex: 1
	},
	duration: {
		marginHorizontal: 12,
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

const formatTime = (seconds: number) => moment.utc(seconds * 1000).format('mm:ss');

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const Button = React.memo(({ loading, paused, onPress, disabled, cached }: IButton) => {
	const { colors } = useTheme();

	let customIconName: 'arrow-down-circle' | 'play-filled' | 'pause-filled' = 'arrow-down-circle';
	if (cached) {
		customIconName = paused ? 'play-filled' : 'pause-filled';
	}
	return (
		<Touchable
			style={styles.playPauseButton}
			disabled={disabled}
			onPress={onPress}
			hitSlop={BUTTON_HIT_SLOP}
			background={Touchable.SelectableBackgroundBorderless()}
		>
			{loading ? (
				<ActivityIndicator style={[styles.playPauseButton, styles.audioLoading]} />
			) : (
				<CustomIcon name={customIconName} size={36} color={disabled ? colors.tintDisabled : colors.tintColor} />
			)}
		</Touchable>
	);
});

Button.displayName = 'MessageAudioButton';

const MessageAudio = ({ file, getCustomEmoji, author, isReply, style }: IMessageAudioProps) => {
	const [loading, setLoading] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [paused, setPaused] = useState(true);
	const [cached, setCached] = useState(false);

	const { baseUrl, user } = useContext(MessageContext);
	const { scale } = useWindowDimensions();
	const { theme } = useTheme();

	const sound = useRef<Sound | null>(null);

	const pauseSound = () => {
		EventEmitter.removeListener(PAUSE_AUDIO, pauseSound);
		togglePlayPause();
	};

	const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
		if (status) {
			onLoad(status);
			onProgress(status);
			onEnd(status);
		}
	};

	const getUrl = () => {
		let url = file.audio_url;
		if (url && !url.startsWith('http')) {
			url = `${baseUrl}${file.audio_url}`;
		}
		return url;
	};

	const onLoad = (data: AVPlaybackStatus) => {
		if (data.isLoaded && data.durationMillis) {
			const duration = data.durationMillis / 1000;
			setDuration(duration > 0 ? duration : 0);
		}
	};

	const onProgress = (data: AVPlaybackStatus) => {
		if (data.isLoaded) {
			const currentTime = data.positionMillis / 1000;
			if (currentTime <= duration) {
				setCurrentTime(currentTime);
			}
		}
	};

	const onEnd = async (data: AVPlaybackStatus) => {
		if (data.isLoaded) {
			if (data.didJustFinish) {
				try {
					await sound.current?.stopAsync();
					setPaused(true);
					setCurrentTime(0);
					EventEmitter.removeListener(PAUSE_AUDIO, pauseSound);
				} catch {
					// do nothing
				}
			}
		}
	};

	const getDuration = () => formatTime(currentTime || duration);

	const togglePlayPause = () => {
		setPaused(!paused);
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
				await sound.current?.loadAsync({ uri: audio });
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
		if (cached) {
			togglePlayPause();
			return;
		}
		handleDownload();
	};

	const onValueChange = async (value: number) => {
		try {
			setCurrentTime(value);
			await sound.current?.setPositionAsync(value * 1000);
		} catch {
			// Do nothing
		}
	};

	useEffect(() => {
		sound.current = new Audio.Sound();
		sound.current?.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
		return () => {
			EventEmitter.removeListener(PAUSE_AUDIO, pauseSound);
			try {
				sound.current?.stopAsync();
			} catch {
				// Do nothing
			}
		};
	}, []);

	useEffect(() => {
		const handleCache = async () => {
			const cachedAudioResult = await getMediaCache({
				type: 'audio',
				mimeType: file.audio_type,
				urlToCache: getUrl()
			});
			if (cachedAudioResult?.exists) {
				await sound.current?.loadAsync({ uri: cachedAudioResult.uri });
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
		const playPause = async () => {
			try {
				if (paused) {
					await sound.current?.pauseAsync();
					EventEmitter.removeListener(PAUSE_AUDIO, pauseSound);
				} else {
					EventEmitter.emit(PAUSE_AUDIO);
					EventEmitter.addEventListener(PAUSE_AUDIO, pauseSound);
					await Audio.setAudioModeAsync(mode);
					await sound.current?.playAsync();
				}
			} catch {
				// Do nothing
			}
		};
		playPause();
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwake();
		}
	}, [paused]);

	if (!baseUrl) {
		return null;
	}

	let thumbColor;
	if (isAndroid && isReply) {
		thumbColor = themes[theme].tintDisabled;
	} else if (isAndroid) {
		thumbColor = themes[theme].tintColor;
	}

	return (
		<>
			<Markdown
				msg={file.description}
				style={[isReply && style]}
				username={user.username}
				getCustomEmoji={getCustomEmoji}
				theme={theme}
			/>
			<View
				style={[
					styles.audioContainer,
					{ backgroundColor: themes[theme].chatComponentBackground, borderColor: themes[theme].borderColor }
				]}
			>
				<Button disabled={isReply} loading={loading} paused={paused} cached={cached} onPress={onPress} />
				<Slider
					disabled={isReply}
					style={styles.slider}
					value={currentTime}
					maximumValue={duration}
					minimumValue={0}
					thumbTintColor={thumbColor}
					minimumTrackTintColor={themes[theme].tintColor}
					maximumTrackTintColor={themes[theme].auxiliaryText}
					onValueChange={onValueChange}
					thumbImage={isIOS ? { uri: 'audio_thumb', scale } : undefined}
				/>
				<Text style={[styles.duration, { color: themes[theme].auxiliaryText }]}>{getDuration()}</Text>
			</View>
		</>
	);
};

export default MessageAudio;
