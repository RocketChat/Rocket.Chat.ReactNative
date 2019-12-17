import React from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CameraRoll from '@react-native-community/cameraroll';
import { FileSystem } from 'react-native-unimodules';
import { SharedElement } from 'react-navigation-shared-element';
import { Video } from 'expo-av';

import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import I18n from '../i18n';
import { withTheme } from '../theme';
import ImagePinch from '../utils/ImagePinch';
import { themedHeader } from '../utils/navigation';
import { themes } from '../constants/colors';
import { formatAttachmentUrl } from '../lib/utils';
import RCActivityIndicator from '../containers/ActivityIndicator';
import { SaveButton } from '../containers/HeaderButton';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

class ImageView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const { theme } = screenProps;
		const attachment = navigation.getParam('attachment');
		const handleSave = navigation.getParam('handleSave', () => {});
		const { title, video_url } = attachment;
		return {
			title,
			...themedHeader(theme),
			gesturesEnabled: false,
			headerRight: !video_url ? <SaveButton testID='save-image' onPress={handleSave} /> : null
		};
	}

	static sharedElements = () => [{ id: 'image' }];

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	}

	constructor(props) {
		super(props);
		const attachment = props.navigation.getParam('attachment');
		this.state = { attachment, loading: true };
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ handleSave: this.handleSave });
	}

	handleSave = async() => {
		const { attachment } = this.state;
		const { user, baseUrl } = this.props;
		const img = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
		this.setState({ loading: true });
		try {
			const file = `${ FileSystem.documentDirectory + img[0] + Math.floor(Math.random() * 1000) }.jpg`;
			const { uri } = await FileSystem.downloadAsync(img, file);
			await CameraRoll.saveToCameraRoll(uri);
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			EventEmitter.emit(LISTENER, { message: I18n.t('error-save-image') });
		}
		this.setState({ loading: false });
	};

	renderContent() {
		const { attachment } = this.state;
		const { user, baseUrl } = this.props;
		if (attachment && attachment.image_url) {
			const uri = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
			return (
				<SharedElement id={uri} style={StyleSheet.absoluteFill}>
					<ImagePinch
						uri={uri}
						onLoadEnd={() => this.setState({ loading: false })}
					/>
				</SharedElement>
			);
		}
		if (attachment && attachment.video_url) {
			const uri = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
			return (
				<Video
					source={{ uri }}
					rate={1.0}
					volume={1.0}
					isMuted={false}
					resizeMode={Video.RESIZE_MODE_CONTAIN}
					shouldPlay
					isLooping={false}
					style={styles.container}
					useNativeControls
					onReadyForDisplay={() => this.setState({ loading: false })}
					onError={console.log}
				/>
			);
		}
		return null;
	}

	render() {
		const { loading } = this.state;
		const { theme } = this.props;
		return (
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				{this.renderContent()}
				{loading ? <RCActivityIndicator absolute size='large' theme={theme} /> : null}
			</View>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
});

export default connect(mapStateToProps)(withTheme(ImageView));
