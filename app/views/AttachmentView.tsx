import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useHeaderHeight } from '@react-navigation/elements';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { PermissionsAndroid, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import { useEvent } from 'expo';

import { isImageBase64 } from '../lib/methods';
import RCActivityIndicator from '../containers/ActivityIndicator';
import * as HeaderButton from '../containers/Header/components/HeaderButton';
import { ImageViewer } from '../containers/ImageViewer';
import { LISTENER } from '../containers/Toast';
import { IAttachment } from '../definitions';
import I18n from '../i18n';
import { useAppSelector } from '../lib/hooks';
import { useAppNavigation, useAppRoute } from '../lib/hooks/navigation';
import { formatAttachmentUrl, isAndroid, fileDownload, showErrorAlert } from '../lib/methods/helpers';
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
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const headerHeight = useHeaderHeight();
	const { baseUrl, user } = useAppSelector(
		state => ({
			baseUrl: state.server.server,
			user: { id: getUserSelector(state).id, token: getUserSelector(state).token }
		}),
		shallowEqual
	);

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
		const url = formatAttachmentUrl(attachment.title_link || attachment.video_url, user.id, user.token, baseUrl);
		const uri = encodeURI(url);

		return <AttachmentVideoView setLoading={setLoading} url={uri} />;
	}
	return null;
};

const AttachmentVideoView = ({ setLoading, url }: { setLoading: React.Dispatch<React.SetStateAction<boolean>>; url: string }) => {
	const navigation = useAppNavigation<TNavigation, 'AttachmentView'>();
	const player = useVideoPlayer({ uri: url }, (videoPlayer: VideoPlayer) => {
		videoPlayer.play();
		videoPlayer.playbackRate = 1.0;
		videoPlayer.volume = 1.0;
		videoPlayer.muted = false;
		videoPlayer.loop = false;
	});

	const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
	const { status } = useEvent(player, 'statusChange', { status: player.status });

	useEffect(() => {
		if (status === 'readyToPlay') {
			setLoading(false);
		}
		if (status === 'error') {
			navigation.pop();
			showErrorAlert(I18n.t('Error_play_video'));
		}
	}, [status]);

	React.useLayoutEffect(() => {
		const blurSub = navigation.addListener('blur', () => {
			if (player && isPlaying) {
				player.pause();
			}
		});
		return () => {
			blurSub();
		};
	}, [navigation, isPlaying]);

	return <VideoView player={player} contentFit={'contain'} style={{ flex: 1 }} nativeControls={status !== 'loading'} />;
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

	const getTitle = () => {
		const { image_url, video_url, title_link, title } = attachment;

		if (title) {
			try {
				return decodeURI(title);
			} catch {
				return title;
			}
		}

		const url = image_url ?? video_url ?? title_link;
		if (!url) return '';

		const parts = url.split('/');
		return parts.at(-1);
	};

	const setHeader = () => {
		const title = getTitle();
		const options = {
			title: title || '',
			headerLeft: () => (
				<HeaderButton.CloseModal
					testID='close-attachment-view'
					navigation={navigation}
					color={colors.fontDefault}
					style={{ marginRight: -12 }}
				/>
			),
			headerRight:
				Allow_Save_Media_to_Gallery && !isImageBase64(attachment.image_url)
					? () => <HeaderButton.Download testID='save-image' onPress={handleSave} color={colors.fontDefault} />
					: undefined
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
				const file = await fileDownload(mediaAttachment, {}, filename);
				await CameraRoll.save(file, { album: 'Rocket.Chat' });
				FileSystem.deleteAsync(file, { idempotent: true });
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			EventEmitter.emit(LISTENER, { message: I18n.t(image_url ? 'error-save-image' : 'error-save-video') });
		}
		setLoading(false);
	};

	return (
		<View style={{ backgroundColor: colors.surfaceRoom, flex: 1 }}>
			<RenderContent attachment={attachment} setLoading={setLoading} />
			{loading ? <RCActivityIndicator absolute size='large' /> : null}
		</View>
	);
};

export default AttachmentView;
