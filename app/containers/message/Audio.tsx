import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import Slider from '@react-native-community/slider';
import moment from 'moment';
import { dequal } from 'dequal';
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
import { withDimensions } from '../../dimensions';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import { TSupportedThemes, useTheme } from '../../theme';
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
	theme: TSupportedThemes;
	getCustomEmoji: TGetCustomEmoji;
	scale?: number;
	author?: IUserMessage;
	msg?: string;
}

interface IMessageAudioState {
	loading: boolean;
	currentTime: number;
	duration: number;
	paused: boolean;
	cached: boolean;
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

class MessageAudio extends React.Component<IMessageAudioProps, IMessageAudioState> {
	static contextType = MessageContext;

	private sound: Sound;

	constructor(props: IMessageAudioProps) {
		super(props);
		this.state = {
			loading: true,
			currentTime: 0,
			duration: 0,
			paused: true,
			cached: false
		};

		this.sound = new Audio.Sound();
		this.sound.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);
	}

	pauseSound = () => {
		EventEmitter.removeListener(PAUSE_AUDIO, this.pauseSound);
		this.togglePlayPause();
	};

	async componentDidMount() {
		const { file, isReply } = this.props;
		const cachedAudioResult = await getMediaCache({
			type: 'audio',
			mimeType: file.audio_type,
			urlToCache: this.getUrl()
		});
		if (cachedAudioResult?.exists) {
			await this.sound.loadAsync({ uri: cachedAudioResult.uri });
			this.setState({ loading: false, cached: true });
			return;
		}
		if (isReply) {
			this.setState({ loading: false });
			return;
		}
		await this.handleAutoDownload();
	}

	shouldComponentUpdate(nextProps: IMessageAudioProps, nextState: IMessageAudioState) {
		const { currentTime, duration, paused, loading, cached } = this.state;
		const { file, theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.currentTime !== currentTime) {
			return true;
		}
		if (nextState.duration !== duration) {
			return true;
		}
		if (nextState.paused !== paused) {
			return true;
		}
		if (!dequal(nextProps.file, file)) {
			return true;
		}
		if (nextState.loading !== loading) {
			return true;
		}
		if (nextState.cached !== cached) {
			return true;
		}
		return false;
	}

	componentDidUpdate() {
		const { paused } = this.state;
		if (paused) {
			deactivateKeepAwake();
		} else {
			activateKeepAwake();
		}
	}

	async componentWillUnmount() {
		EventEmitter.removeListener(PAUSE_AUDIO, this.pauseSound);
		try {
			await this.sound.stopAsync();
		} catch {
			// Do nothing
		}
	}

	getUrl = () => {
		const { file } = this.props;
		// @ts-ignore can't use declare to type this
		const { baseUrl } = this.context;

		let url = file.audio_url;
		if (url && !url.startsWith('http')) {
			url = `${baseUrl}${file.audio_url}`;
		}
		return url;
	};

	handleAutoDownload = async () => {
		const { author } = this.props;
		// @ts-ignore can't use declare to type this
		const { user } = this.context;
		const url = this.getUrl();
		try {
			if (url) {
				const isCurrentUserAuthor = author?._id === user.id;
				const isAutoDownloadEnabled = fetchAutoDownloadEnabled('audioPreferenceDownload');
				if (isAutoDownloadEnabled || isCurrentUserAuthor) {
					await this.handleDownload();
					return;
				}

				this.setState({ loading: false, cached: false });
			}
		} catch {
			// Do nothing
		}
	};

	onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
		if (status) {
			this.onLoad(status);
			this.onProgress(status);
			this.onEnd(status);
		}
	};

	onLoad = (data: AVPlaybackStatus) => {
		if (data.isLoaded && data.durationMillis) {
			const duration = data.durationMillis / 1000;
			this.setState({ duration: duration > 0 ? duration : 0 });
		}
	};

	onProgress = (data: AVPlaybackStatus) => {
		if (data.isLoaded) {
			const { duration } = this.state;
			const currentTime = data.positionMillis / 1000;
			if (currentTime <= duration) {
				this.setState({ currentTime });
			}
		}
	};

	onEnd = async (data: AVPlaybackStatus) => {
		if (data.isLoaded) {
			if (data.didJustFinish) {
				try {
					await this.sound.stopAsync();
					this.setState({ paused: true, currentTime: 0 });
					EventEmitter.removeListener(PAUSE_AUDIO, this.pauseSound);
				} catch {
					// do nothing
				}
			}
		}
	};

	get duration() {
		const { currentTime, duration } = this.state;
		return formatTime(currentTime || duration);
	}

	togglePlayPause = () => {
		const { paused } = this.state;
		this.setState({ paused: !paused }, this.playPause);
	};

	handleDownload = async () => {
		const { file } = this.props;
		// @ts-ignore can't use declare to type this
		const { user } = this.context;
		this.setState({ loading: true });
		try {
			const url = this.getUrl();
			if (url) {
				const audio = await downloadMediaFile({
					downloadUrl: `${url}?rc_uid=${user.id}&rc_token=${user.token}`,
					type: 'audio',
					mimeType: file.audio_type
				});
				await this.sound.loadAsync({ uri: audio });
				this.setState({ loading: false, cached: true });
			}
		} catch {
			this.setState({ loading: false, cached: false });
		}
	};

	onPress = () => {
		const { cached, loading } = this.state;
		if (loading) {
			return;
		}
		if (cached) {
			this.togglePlayPause();
			return;
		}
		this.handleDownload();
	};

	playPause = async () => {
		const { paused } = this.state;
		try {
			if (paused) {
				await this.sound.pauseAsync();
				EventEmitter.removeListener(PAUSE_AUDIO, this.pauseSound);
			} else {
				EventEmitter.emit(PAUSE_AUDIO);
				EventEmitter.addEventListener(PAUSE_AUDIO, this.pauseSound);
				await Audio.setAudioModeAsync(mode);
				await this.sound.playAsync();
			}
		} catch {
			// Do nothing
		}
	};

	onValueChange = async (value: number) => {
		try {
			this.setState({ currentTime: value });
			await this.sound.setPositionAsync(value * 1000);
		} catch {
			// Do nothing
		}
	};

	render() {
		const { loading, paused, currentTime, duration, cached } = this.state;
		const { msg, getCustomEmoji, theme, scale, isReply, style } = this.props;
		// @ts-ignore can't use declare to type this
		const { baseUrl, user } = this.context;

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
				<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				<View
					style={[
						styles.audioContainer,
						{ backgroundColor: themes[theme].chatComponentBackground, borderColor: themes[theme].borderColor }
					]}
				>
					<Button disabled={isReply} loading={loading} paused={paused} cached={cached} onPress={this.onPress} />
					<Slider
						disabled={isReply}
						style={styles.slider}
						value={currentTime}
						maximumValue={duration}
						minimumValue={0}
						thumbTintColor={thumbColor}
						minimumTrackTintColor={themes[theme].tintColor}
						maximumTrackTintColor={themes[theme].auxiliaryText}
						onValueChange={this.onValueChange}
						thumbImage={isIOS ? { uri: 'audio_thumb', scale } : undefined}
					/>
					<Text style={[styles.duration, { color: themes[theme].auxiliaryText }]}>{this.duration}</Text>
				</View>
			</>
		);
	}
}

export default withDimensions(MessageAudio);
