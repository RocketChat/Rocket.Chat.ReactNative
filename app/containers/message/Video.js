import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { connect } from 'react-redux';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';

const SUPPORTED_TYPES = ['video/webm'];
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
export default class Video extends React.PureComponent {
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
			uri: `${ server }${ file.video_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
	}

	isTypeSupported() {
		return SUPPORTED_TYPES.indexOf(this.props.file.video_type) === -1;
	}

	toggleModal() {
		this.setState({
			isVisible: !this.state.isVisible
		});
	}

	open() {
		if (!this.isTypeSupported()) {
			Linking.openURL(this.state.uri);
		} else {
			this.toggleModal();
		}
	}

	render() {
		const { isVisible, uri } = this.state;
		return (
			<View>
				<TouchableOpacity
					style={styles.container}
					onPress={() => this.open()}
				>
					<Image
						source={require('../../images/logo.png')}
						style={styles.image}
					/>
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
