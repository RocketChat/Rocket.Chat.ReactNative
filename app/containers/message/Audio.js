// import React from 'react';
// import PropTypes from 'prop-types';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { connect } from 'react-redux';
// import Sound from 'react-native-sound';

// const styles = StyleSheet.create({
// 	container: {
// 		flex: 1,
// 		justifyContent: 'center'
// 	}
// });

// @connect(state => ({
// 	server: state.server.server
// }))
// export default class Audio extends React.PureComponent {
// 	static propTypes = {
// 		file: PropTypes.object.isRequired,
// 		server: PropTypes.string.isRequired
// 	}

// 	constructor(props) {
// 		super(props);
// 		this.state = {
// 			paused: true,
// 			loading: true
// 		};
// 		const { file, server } = this.props;
// 		const tmp = 'https://s3.amazonaws.com/hanselminutes/hanselminutes_0001.mp3';
// 		const uri = tmp;
// 		this.sound = new Sound(uri, undefined, (error) => {
// 			if (error) {
// 				console.warn(error);
// 			} else {
// 				this.setState({ loading: false });
// 				// console.log('Playing sound');
// 				// sound.play(() => {
// 				// // Release when it's done so we're not using up resources
// 				// 	sound.release();
// 				// });
// 			}
// 		});
// 	}

// 	onPress() {
// 		if (this.state.paused) {
// 			this.sound.play();
// 		} else {
// 			this.sound.pause();
// 		}
// 		this.setState({ paused: !this.state.paused });
// 	}

// 	// getCurrentTime() {
// 	// 	this.sound.getCurrentTime(seconds => console.warn(seconds));
// 	// }

// 	render() {
// 		if (this.state.loading) {
// 			return <Text>Loading...</Text>;
// 		}
// 		// this.getCurrentTime();
// 		return (
// 			<TouchableOpacity
// 				style={styles.container}
// 				onPress={() => this.onPress()}
// 			>
// 				<Text>{this.state.paused ? 'Play' : 'Pause'}</Text>
// 			</TouchableOpacity>
// 		);
// 	}
// }

import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		height: 100,
		margin: 5
	},
	modal: {
		margin: 0,
		backgroundColor: '#000'
	},
	image: {
		flex: 1,
		width: null,
		height: null,
		resizeMode: 'contain'
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
		this.state = {
			isVisible: false,
			uri: `${ server }${ file.audio_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
	}

	toggleModal() {
		this.setState({
			isVisible: !this.state.isVisible
		});
	}

	render() {
		const { isVisible, uri } = this.state;
		return (
			<View>
				<TouchableOpacity
					style={styles.container}
					onPress={() => this.toggleModal()}
				>
					<Text>AUDIO</Text>
				</TouchableOpacity>
				<Modal
					isVisible={isVisible}
					style={styles.modal}
					supportedOrientations={['portrait', 'landscape']}
				>
					<VideoPlayer
						source={{ uri }}
						onBack={() => this.toggleModal()}
						disableVolume
					/>
				</Modal>
			</View>
		);
	}
}
