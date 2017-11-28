import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { connect } from 'react-redux';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from 'react-native-slider';

const SUPPORTED_TYPES = ['video/webm'];
const styles = StyleSheet.create({
	container: {
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

@connect(state => ({
	server: state.server.server,
	user: state.login.user
}))
export default class Audio extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		server: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		const { server, file, user } = this.props;
		this.onLoad = this.onLoad.bind(this);
		this.onProgress = this.onProgress.bind(this);
		this.onEnd = this.onEnd.bind(this);
		this.state = {
			currentTime: 0,
			duration: 0,
			paused: true,
			uri: `${ server }${ file.audio_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
	}

	onLoad(data) {
		this.setState({ duration: data.duration });
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
		return this.formatTime(this.state.currentTime);
	}

	getDuration() {
		return this.formatTime(this.state.duration);
	}

	formatTime(time = 0) {
		time = Math.min(
			Math.max(time, 0),
			this.state.duration
		);
		const formattedMinutes = Math.floor(time / 60).toFixed(0).padStart(2, 0);
		const formattedSeconds = Math.floor(time % 60).toFixed(0).padStart(2, 0);
		return `${ formattedMinutes }:${ formattedSeconds }`;
	}

	isTypeSupported() {
		return SUPPORTED_TYPES.indexOf(this.props.file.audio_type) === -1;
	}

	togglePlayPause() {
		this.setState({ paused: !this.state.paused });
	}

	render() {
		const { uri, paused } = this.state;
		return (
			<View style={styles.container}>
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
						thumbTintColor='#ccc'
						onValueChange={value => this.setState({ currentTime: value })}
					/>
				</View>
			</View>
		);
	}
}
