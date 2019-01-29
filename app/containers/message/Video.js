import React from 'react';
import PropTypes from 'prop-types';
import {
	StyleSheet, Image, View
} from 'react-native';
import Modal from 'react-native-modal';
import VideoPlayer from 'react-native-video-controls';
import { RectButton } from 'react-native-gesture-handler';

import Markdown from './Markdown';
import openLink from '../../utils/openLink';
import { isIOS } from '../../utils/deviceInfo';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/webm', 'video/3gp', 'video/mkv'])];
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
		const { baseUrl, user, file } = this.props;
		const { video_url } = file;
		return `${ baseUrl }${ video_url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
	}

	toggleModal() {
		this.setState(prevState => ({
			isVisible: !prevState.isVisible
		}));
	}

	open() {
		const { file } = this.props;
		if (isTypeSupported(file.video_type)) {
			return this.toggleModal();
		}
		openLink(this.uri);
	}

	render() {
		const { isVisible } = this.state;
		const {
			baseUrl, user, customEmojis, file
		} = this.props;
		const { description } = file;

		if (!baseUrl) {
			return null;
		}

		return (
			[
				<View key='button'>
					<RectButton
						style={styles.button}
						onPress={() => this.open()}
						activeOpacity={0.5}
						underlayColor='#fff'
					>
						<Image
							source={{ uri: 'play_video' }}
							style={styles.image}
						/>
					</RectButton>
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
