import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, Text, Easing
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import moment from 'moment';
import { dequal } from 'dequal';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

import Touchable from './Touchable';
import Markdown from '../markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import MessageContext from './Context';
import ActivityIndicator from '../ActivityIndicator';
import { withDimensions } from '../../dimensions';

const mode = {
	allowsRecordingIOS: false,
	playsInSilentModeIOS: true,
	staysActiveInBackground: false,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
	interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
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

const formatTime = seconds => moment.utc(seconds * 1000).format('mm:ss');
const BUTTON_HIT_SLOP = {
	top: 12, right: 12, bottom: 12, left: 12
};
const sliderAnimationConfig = {
	duration: 250,
	easing: Easing.linear,
	delay: 0
};

const Button = React.memo(({
	loading, paused, onPress, theme
}) => (
	<Touchable
		style={styles.playPauseButton}
		onPress={onPress}
		hitSlop={BUTTON_HIT_SLOP}
		background={Touchable.SelectableBackgroundBorderless()}
	>
		{
			loading
				? <ActivityIndicator style={[styles.playPauseButton, styles.audioLoading]} theme={theme} />
				: <CustomIcon name={paused ? 'play-filled' : 'pause-filled'} size={36} color={themes[theme].tintColor} />
		}
	</Touchable>
));

Button.propTypes = {
	loading: PropTypes.bool,
	paused: PropTypes.bool,
	theme: PropTypes.string,
	onPress: PropTypes.func
};
Button.displayName = 'MessageAudioButton';

class MessageAudio extends React.Component {
	static contextType = MessageContext;

	static propTypes = {
		file: PropTypes.object.isRequired,
		theme: PropTypes.string,
		getCustomEmoji: PropTypes.func,
		scale: PropTypes.number
	}

	constructor(props) {
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
		if (!url.startsWith('http')) {
			url = `${ baseUrl }${ file.audio_url }`;
		}

		this.setState({ loading: true });
		try {
			await this.sound.loadAsync({ uri: `${ url }?rc_uid=${ user.id }&rc_token=${ user.token }` });
		} catch {
			// Do nothing
		}
		this.setState({ loading: false });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			currentTime, duration, paused, loading
		} = this.state;
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

	onPlaybackStatusUpdate = (status) => {
		if (status) {
			this.onLoad(status);
			this.onProgress(status);
			this.onEnd(status);
		}
	}

	onLoad = (data) => {
		const duration = data.durationMillis / 1000;
		this.setState({ duration: duration > 0 ? duration : 0 });
	}

	onProgress = (data) => {
		const { duration } = this.state;
		const currentTime = data.positionMillis / 1000;
		if (currentTime <= duration) {
			this.setState({ currentTime });
		}
	}

	onEnd = async(data) => {
		if (data.didJustFinish) {
			try {
				await this.sound.stopAsync();
				this.setState({ paused: true, currentTime: 0 });
			} catch {
				// do nothing
			}
		}
	}

	get duration() {
		const { currentTime, duration } = this.state;
		return formatTime(currentTime || duration);
	}

	togglePlayPause = () => {
		const { paused } = this.state;
		this.setState({ paused: !paused }, this.playPause);
	}

	playPause = async() => {
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
	}

	onValueChange = async(value) => {
		try {
			this.setState({ currentTime: value });
			await this.sound.setPositionAsync(value * 1000);
		} catch {
			// Do nothing
		}
	}

	render() {
		const {
			loading, paused, currentTime, duration
		} = this.state;
		const {
			file, getCustomEmoji, theme, scale
		} = this.props;
		const { description } = file;
		const { baseUrl, user } = this.context;

		if (!baseUrl) {
			return null;
		}

		return (
			<>
				<View
					style={[
						styles.audioContainer,
						{ backgroundColor: themes[theme].chatComponentBackground, borderColor: themes[theme].borderColor }
					]}
				>
					<Button loading={loading} paused={paused} onPress={this.togglePlayPause} theme={theme} />
					<Slider
						style={styles.slider}
						value={currentTime}
						maximumValue={duration}
						minimumValue={0}
						animateTransitions
						animationConfig={sliderAnimationConfig}
						thumbTintColor={isAndroid && themes[theme].tintColor}
						minimumTrackTintColor={themes[theme].tintColor}
						maximumTrackTintColor={themes[theme].auxiliaryText}
						onValueChange={this.onValueChange}
						thumbImage={isIOS && { uri: 'audio_thumb', scale }}
					/>
					<Text style={[styles.duration, { color: themes[theme].auxiliaryText }]}>{this.duration}</Text>
				</View>
				<Markdown msg={description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
			</>
		);
	}
}

export default withDimensions(MessageAudio);
