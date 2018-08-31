import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';
import { connect } from 'react-redux';
import Markdown from './Markdown';
import openLink from '../../utils/openLink';

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

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class Video extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired
	}

	state = { isVisible: false };

	get uri() {
		const { video_url } = this.props.file;
		const { baseUrl, user } = this.props;
		return `${ baseUrl }${ video_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
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
		openLink(this.uri);
	}

	render() {
		const { isVisible } = this.state;
		const { description } = this.props.file;
		return (
			[
				<TouchableOpacity
					key='button'
					style={styles.container}
					onPress={() => this.open()}
				>
					<Image
						source={require('../../static/images/logo.png')}
						style={styles.image}
					/>
					<Markdown msg={description} />
				</TouchableOpacity>,
				<Modal
					key='modal'
					isVisible={isVisible}
					style={styles.modal}
					supportedOrientations={['portrait', 'landscape']}
					onBackButtonPress={() => this.toggleModal()}
				>
					<VideoPlayer
						source={{ uri: this.uri }}
						onBack={() => this.toggleModal()}
						disableVolume
					/>
				</Modal>
			]
		);
	}
}
