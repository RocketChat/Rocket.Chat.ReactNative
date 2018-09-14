import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text, Easing, Image } from 'react-native';
import Video from 'react-native-video';
import Slider from 'react-native-slider';
import moment from 'moment';

import Markdown from './Markdown';

const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		height: 56,
		backgroundColor: '#f7f8fa',
		borderRadius: 4,
		marginBottom: 10
	},
	playPauseButton: {
		width: 56,
		alignItems: 'center',
		backgroundColor: 'transparent'
	},
	playPauseImage: {
		width: 30,
		height: 30
	},
	slider: {
		flex: 1,
		marginRight: 10
	},
	duration: {
		marginRight: 16,
		fontSize: 14,
		fontWeight: '500',
		color: '#54585e'
	},
	thumbStyle: {
		width: 12,
		height: 12
	}
});

const formatTime = seconds => moment.utc(seconds * 1000).format('mm:ss');

export default class Audio extends React.PureComponent {
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

	onLoad(data) {
		this.setState({ duration: data.duration > 0 ? data.duration : 0 });
	}

	onProgress(data) {
		if (data.currentTime <= this.state.duration) {
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
		return formatTime(this.state.duration);
	}

	togglePlayPause() {
		this.setState({ paused: !this.state.paused });
	}

	render() {
		const { uri, paused } = this.state;
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
					<TouchableOpacity
						style={styles.playPauseButton}
						onPress={() => this.togglePlayPause()}
					>
						{
							paused ?
								<Image source={{ uri: 'play' }} style={styles.playPauseImage} /> :
								<Image source={{ uri: 'pause' }} style={styles.playPauseImage} />
						}
					</TouchableOpacity>
					<Slider
						style={styles.slider}
						value={this.state.currentTime}
						maximumValue={this.state.duration}
						minimumValue={0}
						animateTransitions
						animationConfig={{
							duration: 250,
							easing: Easing.linear,
							delay: 0
						}}
						thumbTintColor='#1d74f5'
						minimumTrackTintColor='#1d74f5'
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
