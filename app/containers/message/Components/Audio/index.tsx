import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Sound } from 'expo-av/build/Audio/Sound';

import Touchable from '../../Touchable';
import Markdown from '../../../markdown';
import { CustomIcon } from '../../../CustomIcon';
import { themes } from '../../../../lib/constants';
import MessageContext from '../../Context';
// import ActivityIndicator from '../../../ActivityIndicator';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../../../definitions';
import { useTheme } from '../../../../theme';
import { downloadMediaFile, getMediaCache } from '../../../../lib/methods/handleMediaDownload';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { PAUSE_AUDIO } from '../../constants';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import styles from './styles';
import Slider from './Slider';

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

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const Button = React.memo(({ loading, paused, onPress, disabled, cached }: IButton) => {
	const { colors } = useTheme();

	let customIconName: 'arrow-down' | 'play-shape-filled' | 'pause-shape-filled' | 'loading' = 'arrow-down';
	if (cached) {
		customIconName = paused ? 'play-shape-filled' : 'pause-shape-filled';
	}
	if (loading) {
		customIconName = 'loading';
	}
	return (
		<Touchable
			style={[styles.playPauseButton, { backgroundColor: colors.audioPlayerPrimary }]}
			disabled={disabled}
			onPress={onPress}
			hitSlop={BUTTON_HIT_SLOP}
			background={Touchable.SelectableBackgroundBorderless()}
		>
			<CustomIcon name={customIconName} size={24} color={disabled ? colors.tintDisabled : colors.buttonText} />
			{/* {loading ? (
				<ActivityIndicator style={[styles.playPauseButton, styles.audioLoading]} />
			) : (
			)} */}
		</Touchable>
	);
});

Button.displayName = 'MessageAudioButton';

const MessageAudio = ({ file, getCustomEmoji, author, isReply, style }: IMessageAudioProps) => {
	const [loading, setLoading] = useState(true);
	const [paused, setPaused] = useState(true);
	const [cached, setCached] = useState(false);

	const { baseUrl, user } = useContext(MessageContext);
	const { theme } = useTheme();

	const sound = useRef<Sound | null>(null);

	const pauseSound = () => {
		EventEmitter.removeListener(PAUSE_AUDIO, pauseSound);
		togglePlayPause();
	};

	const getUrl = () => {
		let url = file.audio_url;
		if (url && !url.startsWith('http')) {
			url = `${baseUrl}${file.audio_url}`;
		}
		return url;
	};

	const onEnd = async () => {
		try {
			await sound.current?.stopAsync();
			setPaused(true);
			EventEmitter.removeListener(PAUSE_AUDIO, pauseSound);
		} catch {
			// do nothing
		}
	};

	const togglePlayPause = () => {
		setPaused(!paused);
		playPause(!paused);
	};

	const playPause = async (isPaused: boolean) => {
		try {
			if (isPaused) {
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

	useEffect(() => {
		sound.current = new Audio.Sound();

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
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwakeAsync();
		}
	}, [paused]);

	if (!baseUrl) {
		return null;
	}

	let thumbColor;
	if (isReply) {
		thumbColor = themes[theme].tintDisabled;
	} else {
		thumbColor = themes[theme].audioPlayerPrimary;
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
				<Slider sound={sound.current} thumbColor={thumbColor} onEndCallback={onEnd} />
				<View style={{ width: 36, height: 24, backgroundColor: '#999', borderRadius: 4, marginRight: 16 }} />
			</View>
		</>
	);
};

export default MessageAudio;
