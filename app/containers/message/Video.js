import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';
import Markdown from './Markdown';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(Platform.OS === 'ios' ? [] : ['video/webm', 'video/3gp', 'video/mkv'])];
const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;

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

export default class Video extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		const { baseUrl, file, user } = props;
		this.state = {
			isVisible: false,
			uri: `${ baseUrl }${ file.video_url }?rc_uid=${ user.id }&rc_token=${ user.token }`
		};
	}


	toggleModal() {
		this.setState({
			isVisible: !this.state.isVisible
		});
	}

	open() {
		if (isTypeSupported(this.props.file.video_type)) {
			return this.toggleModal();
		}
		Linking.openURL(this.state.uri);
	}

	render() {
		const { isVisible, uri } = this.state;
		const { description } = this.props.file;
		return (
			<View>
				<TouchableOpacity
					style={styles.container}
					onPress={() => this.open()}
				>
					<Image
						source={require('../../../static/images/logo.png')}
						style={styles.image}
					/>
					<Markdown msg={description} />
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
