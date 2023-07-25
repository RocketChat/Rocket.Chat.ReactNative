import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { HeaderBackground, useHeaderHeight } from '@react-navigation/elements';
import { StackNavigationOptions } from '@react-navigation/stack';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { PermissionsAndroid, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';

import RCActivityIndicator from '../containers/ActivityIndicator';
import * as HeaderButton from '../containers/HeaderButton';
import { ImageViewer } from '../containers/ImageViewer';
import StatusBar from '../containers/StatusBar';
import { LISTENER } from '../containers/Toast';
import { IAttachment } from '../definitions';
import I18n from '../i18n';
import { useAppSelector } from '../lib/hooks';
import { useAppNavigation, useAppRoute } from '../lib/hooks/navigation';
import { formatAttachmentUrl, isAndroid } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import { getUserSelector } from '../selectors/login';
import { TNavigation } from '../stacks/stackType';
import { useTheme } from '../theme';
import { LOCAL_DOCUMENT_DIRECTORY, getFilename } from '../lib/methods/handleMediaDownload';

const RenderContent = ({
	setLoading,
	attachment
}: {
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	attachment: IAttachment;
}) => {
	const videoRef = React.useRef<Video>(null);
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const headerHeight = useHeaderHeight();
	const navigation = useAppNavigation<TNavigation, 'AttachmentView'>();
	const { baseUrl, user } = useAppSelector(
		state => ({
			baseUrl: state.server.server,
			user: { id: getUserSelector(state).id, token: getUserSelector(state).token }
		}),
		shallowEqual
	);

	React.useLayoutEffect(() => {
		const blurSub = navigation.addListener('blur', () => {
			if (videoRef.current && videoRef.current.stopAsync) {
				videoRef.current.stopAsync();
			}
		});
		return () => {
			blurSub();
		};
	}, [navigation]);

	if (attachment.image_url) {
		const url = formatAttachmentUrl(attachment.title_link || attachment.image_url, user.id, user.token, baseUrl);
		const uri = encodeURI(url);
		return (
			<ImageViewer
				uri={uri}
				onLoadEnd={() => setLoading(false)}
				width={width}
				height={height - insets.top - insets.bottom - (headerHeight || 0)}
			/>
		);
	}
	if (attachment.video_url) {
		const url = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
		const uri = encodeURI(url);
		return (
			<Video
				source={{ uri }}
				rate={1.0}
				volume={1.0}
				isMuted={false}
				resizeMode={ResizeMode.CONTAIN}
				shouldPlay
				isLooping={false}
				style={{ flex: 1 }}
				useNativeControls
				onLoad={() => setLoading(false)}
				onError={console.log}
				ref={videoRef}
			/>
		);
	}
	return null;
};

const AttachmentView = (): React.ReactElement => {
	const navigation = useAppNavigation<TNavigation, 'AttachmentView'>();
	const {
		params: { attachment }
	} = useAppRoute<TNavigation, 'AttachmentView'>();
	const [loading, setLoading] = React.useState(true);
	const { colors } = useTheme();

	const { baseUrl, user, Allow_Save_Media_to_Gallery } = useAppSelector(
		state => ({
			baseUrl: state.server.server,
			user: { id: getUserSelector(state).id, token: getUserSelector(state).token },
			Allow_Save_Media_to_Gallery: (state.settings.Allow_Save_Media_to_Gallery as boolean) ?? true
		}),
		shallowEqual
	);

	const setHeader = () => {
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
			headerTitleStyle: { color: colors.previewTintColor },
			headerTintColor: colors.previewTintColor,
			headerTitleContainerStyle: { flex: 1, maxWidth: undefined },
			headerLeftContainerStyle: { flexGrow: undefined, flexBasis: undefined },
			headerRightContainerStyle: { flexGrow: undefined, flexBasis: undefined },
			headerLeft: () => (
				<HeaderButton.CloseModal testID='close-attachment-view' navigation={navigation} color={colors.previewTintColor} />
			),
			headerRight: () =>
				Allow_Save_Media_to_Gallery ? (
					<HeaderButton.Download testID='save-image' onPress={handleSave} color={colors.previewTintColor} />
				) : null,
			headerBackground: () => (
				<HeaderBackground style={{ backgroundColor: colors.previewBackground, shadowOpacity: 0, elevation: 0 }} />
			)
		};
		navigation.setOptions(options);
	};

	React.useLayoutEffect(() => {
		setHeader();
	}, [navigation]);

	const handleSave = async () => {
		const { title_link, image_url, image_type, video_url, video_type } = attachment;
		// When the attachment is a video, the video_url refers to local file and the title_link to the link
		const url = video_url || title_link || image_url;

		if (!url) {
			return;
		}

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

		setLoading(true);
		try {
			if (LOCAL_DOCUMENT_DIRECTORY && url.startsWith(LOCAL_DOCUMENT_DIRECTORY)) {
				await CameraRoll.save(url, { album: 'Rocket.Chat' });
			} else {
				const mediaAttachment = formatAttachmentUrl(url, user.id, user.token, baseUrl);
				let filename = '';
				if (image_url) {
					filename = getFilename({ title: attachment.title, type: 'image', mimeType: image_type, url });
				} else {
					filename = getFilename({ title: attachment.title, type: 'video', mimeType: video_type, url });
				}
				const documentDir = `${RNFetchBlob.fs.dirs.DocumentDir}/`;
				const path = `${documentDir + filename}`;
				const file = await RNFetchBlob.config({ path }).fetch('GET', mediaAttachment);
				await CameraRoll.save(path, { album: 'Rocket.Chat' });
				file.flush();
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			EventEmitter.emit(LISTENER, { message: I18n.t(image_url ? 'error-save-image' : 'error-save-video') });
		}
		setLoading(false);
	};

	return (
		<View style={{ backgroundColor: colors.backgroundColor, flex: 1 }}>
			<StatusBar barStyle='light-content' backgroundColor={colors.previewBackground} />
			<RenderContent attachment={attachment} setLoading={setLoading} />
			{loading ? <RCActivityIndicator absolute size='large' /> : null}
		</View>
	);
};

export default AttachmentView;
