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
import { IAttachment } from '../../definitions';
import { TSupportedThemes } from '../../theme';
import { downloadAudioFile } from '../../lib/methods/audioFile';

interface IButton {
	loading: boolean;
	paused: boolean;
	theme: TSupportedThemes;
	disabled?: boolean;
	onPress: () => void;
}

interface IMessageAudioProps {
	file: IAttachment;
	isReply?: boolean;
	style?: StyleProp<TextStyle>[];
	theme: TSupportedThemes;
	getCustomEmoji: TGetCustomEmoji;
	scale?: number;
}

interface IMessageAudioState {
	loading: boolean;
	currentTime: number;
	duration: number;
	paused: boolean;
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

const Button = React.memo(({ loading, paused, onPress, disabled, theme }: IButton) => (
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
			<CustomIcon
				name={paused ? 'play-filled' : 'pause-filled'}
				size={36}
				color={disabled ? themes[theme].tintDisabled : themes[theme].tintColor}
			/>
		)}
	</Touchable>
));

Button.displayName = 'MessageAudioButton';

class MessageAudio extends React.Component<IMessageAudioProps, IMessageAudioState> {
	static contextType = MessageContext;

	private sound: Sound;

	constructor(props: IMessageAudioProps) {
		super(props);
		this.state = {
			loading: false,
			currentTime: 0,
			duration: 0,
			paused: true
		};

		this.sound = new Audio.Sound();
		this.sound.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);
	}

	async componentDidMount() {
		const { file } = this.props;
		const { baseUrl, user } = this.context;

		let url = file.audio_url;
		if (url && !url.startsWith('http')) {
			url = `${baseUrl}${file.audio_url}`;
		}

		this.setState({ loading: true });
		try {
			if (url) {
				const audio = await downloadAudioFile(`${url}?rc_uid=${user.id}&rc_token=${user.token}`, url);
				await this.sound.loadAsync({ uri: audio });
			}
		} catch {
			// Do nothing
		}
		this.setState({ loading: false });
	}

	shouldComponentUpdate(nextProps: IMessageAudioProps, nextState: IMessageAudioState) {
		const { currentTime, duration, paused, loading } = this.state;
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
		try {
			await this.sound.stopAsync();
		} catch {
			// Do nothing
		}
	}

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

	playPause = async () => {
		const { paused } = this.state;
		try {
			if (paused) {
				await this.sound.pauseAsync();
			} else {
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
		const { loading, paused, currentTime, duration } = this.state;
		const { file, getCustomEmoji, theme, scale, isReply, style } = this.props;
		const { description } = file;
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
				<Markdown
					msg={description}
					style={[isReply && style]}
					baseUrl={baseUrl}
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
					<Button disabled={isReply} loading={loading} paused={paused} onPress={this.togglePlayPause} theme={theme} />
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
