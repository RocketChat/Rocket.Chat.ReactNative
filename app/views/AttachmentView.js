import React from 'react';
import { StyleSheet, View, PermissionsAndroid } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CameraRoll from '@react-native-community/cameraroll';
import * as mime from 'react-native-mime-types';
import { FileSystem } from 'react-native-unimodules';
import { Video } from 'expo-av';
import SHA256 from 'js-sha256';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import I18n from '../i18n';
import { withTheme } from '../theme';
import { ImageViewer } from '../presentation/ImageViewer';
import { themes } from '../constants/colors';
import { formatAttachmentUrl } from '../lib/utils';
import RCActivityIndicator from '../containers/ActivityIndicator';
import * as HeaderButton from '../containers/HeaderButton';
import { isAndroid } from '../utils/deviceInfo';
import { getUserSelector } from '../selectors/login';
import { withDimensions } from '../dimensions';
import { getHeaderHeight } from '../containers/Header';
import StatusBar from '../containers/StatusBar';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

class AttachmentView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		baseUrl: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
		insets: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		Allow_Save_Media_to_Gallery: PropTypes.bool
	}

	constructor(props) {
		super(props);
		const attachment = props.route.params?.attachment;
		this.state = { attachment, loading: true };
		this.setHeader();
	}

	componentDidMount() {
		const { navigation } = this.props;
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			if (this.videoRef && this.videoRef.stopAsync) {
				this.videoRef.stopAsync();
			}
		});
	}

	componentWillUnmount() {
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
	}

	setHeader = () => {
		const {
			route, navigation, theme, Allow_Save_Media_to_Gallery
		} = this.props;
		const attachment = route.params?.attachment;
		let { title } = attachment;
		try {
			title = decodeURI(title);
		} catch {
			// Do nothing
		}
		const options = {
			title,
			headerLeft: () => <HeaderButton.CloseModal testID='close-attachment-view' navigation={navigation} buttonStyle={{ color: themes[theme].previewTintColor }} />,
			headerRight: () => (
				Allow_Save_Media_to_Gallery
					? <HeaderButton.Download testID='save-image' onPress={this.handleSave} buttonStyle={{ color: themes[theme].previewTintColor }} />
					: null
			),
			headerBackground: () => <View style={{ flex: 1, backgroundColor: themes[theme].previewBackground }} />,
			headerTintColor: themes[theme].previewTintColor,
			headerTitleStyle: { color: themes[theme].previewTintColor, marginHorizontal: 10 }
		};
		navigation.setOptions(options);
	}

	getVideoRef = ref => this.videoRef = ref;

	handleSave = async() => {
		const { attachment } = this.state;
		const { user, baseUrl } = this.props;
		const {
			image_url, image_type, video_url, video_type
		} = attachment;
		const url = image_url || video_url;
		const mediaAttachment = formatAttachmentUrl(url, user.id, user.token, baseUrl);

		if (isAndroid) {
			const rationale = {
				title: I18n.t('Write_External_Permission'),
				message: I18n.t('Write_External_Permission_Message')
			};
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
			if (!(result || result === PermissionsAndroid.RESULTS.GRANTED)) {
				return;
			}
		}

		this.setState({ loading: true });
		try {
			const extension = image_url ? `.${ mime.extension(image_type) || 'jpg' }` : `.${ mime.extension(video_type) || 'mp4' }`;
			const file = `${ FileSystem.documentDirectory + SHA256(url) + extension }`;
			const { uri } = await FileSystem.downloadAsync(mediaAttachment, file);
			await CameraRoll.save(uri, { album: 'Rocket.Chat' });
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			EventEmitter.emit(LISTENER, { message: I18n.t(image_url ? 'error-save-image' : 'error-save-video') });
		}
		this.setState({ loading: false });
	};

	renderImage = (uri) => {
		const {
			theme, width, height, insets
		} = this.props;
		const headerHeight = getHeaderHeight(width > height);
		return (
			<ImageViewer
				uri={uri}
				onLoadEnd={() => this.setState({ loading: false })}
				theme={theme}
				width={width}
				height={height - insets.top - insets.bottom - headerHeight}
			/>
		);
	}

	renderVideo = uri => (
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
			onLoad={() => this.setState({ loading: false })}
			onError={console.log}
			ref={this.getVideoRef}
		/>
	);

	render() {
		const { loading, attachment } = this.state;
		const { theme, user, baseUrl } = this.props;
		let content = null;

		if (attachment && attachment.image_url) {
			const uri = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
			content = this.renderImage(encodeURI(uri));
		} else if (attachment && attachment.video_url) {
			const uri = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
			content = this.renderVideo(encodeURI(uri));
		}

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<StatusBar barStyle='light-content' backgroundColor={themes[theme].previewBackground} />
				{content}
				{loading ? <RCActivityIndicator absolute size='large' theme={theme} /> : null}
			</View>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	Allow_Save_Media_to_Gallery: state.settings.Allow_Save_Media_to_Gallery ?? true
});

export default connect(mapStateToProps)(withTheme(withDimensions(withSafeAreaInsets(AttachmentView))));
