import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text, Easing } from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from 'react-native-slider';
import Markdown from './Markdown';


const styles = StyleSheet.create({
	audioContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		height: 50,
		margin: 5,
		backgroundColor: '#eee',
		borderRadius: 6
	},
	playPauseButton: {
		width: 50,
		alignItems: 'center',
		backgroundColor: 'transparent',
		borderRightColor: '#ccc',
		borderRightWidth: 1
	},
	playPauseIcon: {
		color: '#ccc',
		backgroundColor: 'transparent'
	},
	progressContainer: {
		flex: 1,
		justifyContent: 'center',
		height: '100%',
		marginHorizontal: 10
	},
	label: {
		color: '#888',
		fontSize: 10
	},
	currentTime: {
		position: 'absolute',
		left: 0,
		bottom: 2
	},
	duration: {
		position: 'absolute',
		right: 0,
		bottom: 2
	}
});

const formatTime = (t = 0, duration = 0) => {
	const time = Math.min(
		Math.max(t, 0),
		duration
	);
	const formattedMinutes = Math.floor(time / 60).toFixed(0).padStart(2, 0);
	const formattedSeconds = Math.floor(time % 60).toFixed(0).padStart(2, 0);
	return `${ formattedMinutes }:${ formattedSeconds }`;
};

export default class Audio extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired
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
		if (data.currentTime < this.state.duration) {
			this.setState({ currentTime: data.currentTime });
		}
	}

	onEnd() {
		this.setState({ paused: true, currentTime: 0 });
		requestAnimationFrame(() => {
			this.player.seek(0);
		});
	}

	getCurrentTime() {
		return formatTime(this.state.currentTime, this.state.duration);
	}

	getDuration() {
		return formatTime(this.state.duration);
	}

	togglePlayPause() {
		this.setState({ paused: !this.state.paused });
	}

	render() {
		const { uri, paused } = this.state;
		const { description } = this.props.file;
		return (
			<View>
				<View style={styles.audioContainer}>
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
							paused ? <Icon name='play-arrow' size={50} style={styles.playPauseIcon} />
								: <Icon name='pause' size={47} style={styles.playPauseIcon} />
						}
					</TouchableOpacity>
					<View style={styles.progressContainer}>
						<Text style={[styles.label, styles.currentTime]}>{this.getCurrentTime()}</Text>
						<Text style={[styles.label, styles.duration]}>{this.getDuration()}</Text>
						<Slider
							value={this.state.currentTime}
							maximumValue={this.state.duration}
							minimumValue={0}
							animateTransitions
							animationConfig={{
								duration: 250,
								easing: Easing.linear,
								delay: 0
							}}
							thumbTintColor='#ccc'
							onValueChange={value => this.setState({ currentTime: value })}
						/>
					</View>
				</View>
				<Markdown msg={description} />
			</View>
		);
	}
}
