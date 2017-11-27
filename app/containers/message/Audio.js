import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import Sound from 'react-native-sound';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	}
});

@connect(state => ({
	server: state.server.server
}))
export default class Audio extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		server: PropTypes.string.isRequired
	}

	constructor(props) {
		super(props);
		this.state = {
			paused: true,
			loading: true
		};
		const { file, server } = this.props;
		const tmp = 'https://s3.amazonaws.com/hanselminutes/hanselminutes_0001.mp3';
		const uri = tmp;
		this.sound = new Sound(uri, undefined, (error) => {
			if (error) {
				console.warn(error);
			} else {
				this.setState({ loading: false });
				// console.log('Playing sound');
				// sound.play(() => {
				// // Release when it's done so we're not using up resources
				// 	sound.release();
				// });
			}
		});
	}

	onPress() {
		if (this.state.paused) {
			this.sound.play();
		} else {
			this.sound.pause();
		}
		this.setState({ paused: !this.state.paused });
	}

	// getCurrentTime() {
	// 	this.sound.getCurrentTime(seconds => console.warn(seconds));
	// }

	render() {
		if (this.state.loading) {
			return <Text>Loading...</Text>;
		}
		// this.getCurrentTime();
		return (
			<TouchableOpacity
				style={styles.container}
				onPress={() => this.onPress()}
			>
				<Text>{this.state.paused ? 'Play' : 'Pause'}</Text>
			</TouchableOpacity>
		);
	}
}
