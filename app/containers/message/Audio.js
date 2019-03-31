import React from 'react';
import PropTypes from 'prop-types';
import {
	View, StyleSheet, Text, Easing
} from 'react-native';
import Video from 'react-native-video';
import Slider from 'react-native-slider';
import moment from 'moment';
import { BorderlessButton } from 'react-native-gesture-handler';
import equal from 'deep-equal';

import Markdown from './Markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { COLOR_BACKGROUND_CONTAINER, COLOR_BORDER, COLOR_PRIMARY } from '../../constants/colors';

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderColor: COLOR_BORDER,
		borderWidth: 1,
		borderRadius: 4,
		marginBottom: 6
	},
	playPauseButton: {
		width: 56,
		alignItems: 'center',
		backgroundColor: 'transparent'
	},
	playPauseImage: {
		color: COLOR_PRIMARY
	},
	slider: {
		flex: 1,
		marginRight: 10
	},
	duration: {
		marginRight: 16,
		fontSize: 14,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	thumbStyle: {
		width: 12,
		height: 12
	}
});

const formatTime = seconds => moment.utc(seconds * 1000).format('mm:ss');

export default class Audio extends React.Component {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired,
		customEmojis: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		this.onLoad = this.onLoad.bind(this);
		this.onProgress = this.onProgress.bind(this);
		this.onEnd = this.onEnd.bind(this);
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
		const { file } = this.props;
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
		return false;
	}

	onLoad(data) {
		this.setState({ duration: data.duration > 0 ? data.duration : 0 });
	}

	onProgress(data) {
		const { duration } = this.state;
		if (data.currentTime <= duration) {
			this.setState({ currentTime: data.currentTime });
		}
	}

	onEnd() {
		this.setState({ paused: true, currentTime: 0 });
		requestAnimationFrame(() => {
			this.player.seek(0);
		});
	}

	getDuration() {
		const { duration } = this.state;
		return formatTime(duration);
	}

	togglePlayPause() {
		const { paused } = this.state;
		this.setState({ paused: !paused });
	}

	render() {
		const {
			uri, paused, currentTime, duration
		} = this.state;
		const {
			user, baseUrl, customEmojis, file
		} = this.props;
		const { description } = file;

		if (!baseUrl) {
			return null;
		}

		return (
			[
				<View key='audio' style={styles.audioContainer}>
					<Video
						ref={(ref) => {
							this.player = ref;
						}}
						source={{ uri }}
						onLoad={this.onLoad}
						onProgress={this.onProgress}
						onEnd={this.onEnd}
						paused={paused}
						repeat={false}
					/>
					<BorderlessButton
						style={styles.playPauseButton}
						onPress={() => this.togglePlayPause()}
					>
						{
							paused
								? <CustomIcon name='play' size={30} style={styles.playPauseImage} />
								: <CustomIcon name='pause' size={30} style={styles.playPauseImage} />
						}
					</BorderlessButton>
					<Slider
						style={styles.slider}
						value={currentTime}
						maximumValue={duration}
						minimumValue={0}
						animateTransitions
						animationConfig={{
							duration: 250,
							easing: Easing.linear,
							delay: 0
						}}
						thumbTintColor={COLOR_PRIMARY}
						minimumTrackTintColor={COLOR_PRIMARY}
						onValueChange={value => this.setState({ currentTime: value })}
						thumbStyle={styles.thumbStyle}
					/>
					<Text style={styles.duration}>{this.getDuration()}</Text>
				</View>,
				<Markdown key='description' msg={description} baseUrl={baseUrl} customEmojis={customEmojis} username={user.username} />
			]
		);
	}
}
