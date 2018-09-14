import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, Image, Platform, View } from 'react-native';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';
import Markdown from './Markdown';
import openLink from '../../utils/openLink';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(Platform.OS === 'ios' ? [] : ['video/webm', 'video/3gp', 'video/mkv'])];
const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		height: 150,
		backgroundColor: '#1f2329',
		marginBottom: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	modal: {
		margin: 0,
		backgroundColor: '#000'
	},
	image: {
		width: 54,
		height: 54
	}
});

export default class Video extends React.PureComponent {
	static propTypes = {
		file: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.object.isRequired,
		customEmojis: PropTypes.object.isRequired
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
		const { baseUrl, user, customEmojis } = this.props;

		if (!baseUrl) {
			return null;
		}

		return (
			[
				<View key='button'>
					<TouchableOpacity
						style={styles.button}
						onPress={() => this.open()}
					>
						<Image
							source={{ uri: 'play_video' }}
							style={styles.image}
						/>
					</TouchableOpacity>
					<Markdown msg={description} customEmojis={customEmojis} baseUrl={baseUrl} username={user.username} />
				</View>,
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
