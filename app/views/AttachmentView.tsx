import React from 'react';
import { PermissionsAndroid, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import CameraRoll from '@react-native-community/cameraroll';
import * as mime from 'react-native-mime-types';
import RNFetchBlob from 'rn-fetch-blob';
import { Video, ResizeMode } from 'expo-av';
import { sha256 } from 'js-sha256';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderBackground, HeaderHeightContext } from '@react-navigation/elements';

import { LISTENER } from '../containers/Toast';
import EventEmitter from '../lib/methods/helpers/events';
import I18n from '../i18n';
import { TSupportedThemes, withTheme } from '../theme';
import { ImageViewer } from '../containers/ImageViewer';
import { themes } from '../lib/constants';
import RCActivityIndicator from '../containers/ActivityIndicator';
import * as HeaderButton from '../containers/HeaderButton';
import { isAndroid, formatAttachmentUrl } from '../lib/methods/helpers';
import { getUserSelector } from '../selectors/login';
import { withDimensions } from '../dimensions';
import StatusBar from '../containers/StatusBar';
import { InsideStackParamList } from '../stacks/types';
import { IApplicationState, IUser, IAttachment } from '../definitions';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

interface IAttachmentViewState {
	attachment: IAttachment;
	loading: boolean;
}

interface IAttachmentViewProps {
	navigation: StackNavigationProp<InsideStackParamList, 'AttachmentView'>;
	route: RouteProp<InsideStackParamList, 'AttachmentView'>;
	theme: TSupportedThemes;
	baseUrl: string;
	width: number;
	height: number;
	insets: { left: number; bottom: number; right: number; top: number };
	user: IUser;
	Allow_Save_Media_to_Gallery: boolean;
}

class AttachmentView extends React.Component<IAttachmentViewProps, IAttachmentViewState> {
	private unsubscribeBlur: (() => void) | undefined;
	private videoRef: any;

	constructor(props: IAttachmentViewProps) {
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
		const { route, navigation, theme, Allow_Save_Media_to_Gallery } = this.props;
		const attachment = route.params?.attachment;
		let { title } = attachment;
		try {
			if (title) {
				title = decodeURI(title);
			}
		} catch {
			// Do nothing
		}
		const options: StackNavigationOptions = {
			title: title || '',
			headerTitleAlign: 'center',
			headerTitleStyle: { color: themes[theme].previewTintColor },
			headerTintColor: themes[theme].previewTintColor,
			headerTitleContainerStyle: { flex: 1, maxWidth: undefined },
			headerLeftContainerStyle: { flexGrow: undefined, flexBasis: undefined },
			headerRightContainerStyle: { flexGrow: undefined, flexBasis: undefined },
			headerLeft: () => (
				<HeaderButton.CloseModal testID='close-attachment-view' navigation={navigation} color={themes[theme].previewTintColor} />
			),
			headerRight: () =>
				Allow_Save_Media_to_Gallery ? (
					<HeaderButton.Download testID='save-image' onPress={this.handleSave} color={themes[theme].previewTintColor} />
				) : null,
			headerBackground: () => (
				<HeaderBackground style={{ backgroundColor: themes[theme].previewBackground, shadowOpacity: 0, elevation: 0 }} />
			)
		};
		navigation.setOptions(options);
	};

	getVideoRef = (ref: Video) => (this.videoRef = ref);

	handleSave = async () => {
		const { attachment } = this.state;
		const { user, baseUrl } = this.props;
		const { title_link, image_url, image_type, video_url, video_type } = attachment;
		const url = title_link || image_url || video_url;

		if (!url) {
			return;
		}

		const mediaAttachment = formatAttachmentUrl(url, user.id, user.token, baseUrl);
		if (isAndroid) {
			const rationale = {
				title: I18n.t('Write_External_Permission'),
				message: I18n.t('Write_External_Permission_Message'),
				buttonPositive: 'Ok'
			};
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
			if (!(result || result === PermissionsAndroid.RESULTS.GRANTED)) {
				return;
			}
		}

		this.setState({ loading: true });
		try {
			const extension = image_url
				? `.${mime.extension(image_type) || 'jpg'}`
				: `.${(video_type === 'video/quicktime' && 'mov') || mime.extension(video_type) || 'mp4'}`;
			// The return of mime.extension('video/quicktime') is .qt,
			// this format the iOS isn't recognize and can't save on gallery
			const documentDir = `${RNFetchBlob.fs.dirs.DocumentDir}/`;
			const path = `${documentDir + sha256(url!) + extension}`;
			const file = await RNFetchBlob.config({ path }).fetch('GET', mediaAttachment);
			await CameraRoll.save(path, { album: 'Rocket.Chat' });
			await file.flush();
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			EventEmitter.emit(LISTENER, { message: I18n.t(image_url ? 'error-save-image' : 'error-save-video') });
		}
		this.setState({ loading: false });
	};

	renderImage = (uri: string) => {
		const { width, height, insets } = this.props;
		return (
			<HeaderHeightContext.Consumer>
				{headerHeight => (
					<ImageViewer
						uri={uri}
						onLoadEnd={() => this.setState({ loading: false })}
						width={width}
						height={height - insets.top - insets.bottom - (headerHeight || 0)}
					/>
				)}
			</HeaderHeightContext.Consumer>
		);
	};

	renderVideo = (uri: string) => (
		<Video
			source={{ uri }}
			rate={1.0}
			volume={1.0}
			isMuted={false}
			resizeMode={ResizeMode.CONTAIN}
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
			const uri = formatAttachmentUrl(attachment.title_link || attachment.image_url, user.id, user.token, baseUrl);
			content = this.renderImage(encodeURI(uri));
		} else if (attachment && attachment.video_url) {
			const uri = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
			content = this.renderVideo(encodeURI(uri));
		}

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<StatusBar barStyle='light-content' backgroundColor={themes[theme].previewBackground} />
				{content}
				{loading ? <RCActivityIndicator absolute size='large' /> : null}
			</View>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	Allow_Save_Media_to_Gallery: (state.settings.Allow_Save_Media_to_Gallery as boolean) ?? true
});

export default connect(mapStateToProps)(withTheme(withDimensions(withSafeAreaInsets(AttachmentView))));
