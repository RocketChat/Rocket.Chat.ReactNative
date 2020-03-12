import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, Text, Easing, Dimensions
} from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import moment from 'moment';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';

import Markdown from '../markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import { withSplit } from '../../split';

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

const Button = React.memo(({ paused, onPress, theme }) => (
	<Touchable
		style={styles.playPauseButton}
		onPress={onPress}
		hitSlop={BUTTON_HIT_SLOP}
		background={Touchable.SelectableBackgroundBorderless()}
	>
		<CustomIcon name={paused ? 'play' : 'pause'} size={36} color={themes[theme].tintColor} />
	</Touchable>
));

Button.propTypes = {
	paused: PropTypes.bool,
	theme: PropTypes.string,
	onPress: PropTypes.func
};
Button.displayName = 'MessageAudioButton';

class Audio extends React.Component {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired,
		theme: PropTypes.string,
		split: PropTypes.bool,
		getCustomEmoji: PropTypes.func
	}

	constructor(props) {
		super(props);
		const { baseUrl, file, user } = props;
		this.state = {
			currentTime: 0,
			duration: 0,
			paused: true,
			uri: `${ baseUrl }${ file.audio_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			currentTime, duration, paused, uri
		} = this.state;
		const { file, split, theme } = this.props;
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
		if (nextState.uri !== uri) {
			return true;
		}
		if (!equal(nextProps.file, file)) {
			return true;
		}
		if (nextProps.split !== split) {
			return true;
		}
		return false;
	}

	onLoad = (data) => {
		this.setState({ duration: data.duration > 0 ? data.duration : 0 });
	}

	onProgress = (data) => {
		const { duration } = this.state;
		if (data.currentTime <= duration) {
			this.setState({ currentTime: data.currentTime });
		}
	}

	onEnd = () => {
		this.setState({ paused: true, currentTime: 0 });
		requestAnimationFrame(() => {
			this.player.seek(0);
		});
	}

	get duration() {
		const { duration } = this.state;
		return formatTime(duration);
	}

	setRef = ref => this.player = ref;

	togglePlayPause = () => {
		const { paused } = this.state;
		this.setState({ paused: !paused });
	}

	onValueChange = value => this.setState({ currentTime: value });

	render() {
		const {
			uri, paused, currentTime, duration
		} = this.state;
		const {
			user, baseUrl, file, getCustomEmoji, split, theme
		} = this.props;
		const { description } = file;

		if (!baseUrl) {
			return null;
		}

		return (
			<>
				<View
					style={[
						styles.audioContainer,
						{ backgroundColor: themes[theme].chatComponentBackground, borderColor: themes[theme].borderColor },
						split && sharedStyles.tabletContent
					]}
				>
					<Video
						ref={this.setRef}
						source={{ uri }}
						onLoad={this.onLoad}
						onProgress={this.onProgress}
						onEnd={this.onEnd}
						paused={paused}
						repeat={false}
						ignoreSilentSwitch='ignore'
					/>
					<Button paused={paused} onPress={this.togglePlayPause} theme={theme} />
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
						thumbImage={isIOS && { uri: 'audio_thumb', scale: Dimensions.get('window').scale }}
					/>
					<Text style={[styles.duration, { color: themes[theme].auxiliaryText }]}>{this.duration}</Text>
				</View>
				<Markdown msg={description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
			</>
		);
	}
}

export default withSplit(Audio);
