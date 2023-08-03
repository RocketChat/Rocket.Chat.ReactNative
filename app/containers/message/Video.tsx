import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, Text } from 'react-native';
import { dequal } from 'dequal';
import FastImage from 'react-native-fast-image';

import messageStyles from './styles';
import Touchable from './Touchable';
import Markdown from '../markdown';
import { isIOS } from '../../lib/methods/helpers';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { fileDownload } from './helpers/fileDownload';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../Toast';
import I18n from '../../i18n';
import { IAttachment } from '../../definitions/IAttachment';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import { cancelDownload, downloadMediaFile, isDownloadActive, getMediaCache } from '../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import sharedStyles from '../../views/Styles';
import BlurComponent from './Components/BlurComponent';

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = (type: string) => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		borderRadius: 4,
		height: 150,
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	},
	cancelContainer: {
		position: 'absolute',
		top: 8,
		right: 8
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	thumbnailImage: {
		borderRadius: 4,
		width: '100%',
		height: '100%'
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
}

const CancelIndicator = () => {
	const { colors } = useTheme();
	return (
		<View style={styles.cancelContainer}>
			<Text style={[styles.text, { color: colors.auxiliaryText }]}>{I18n.t('Cancel')}</Text>
		</View>
	);
};

// TODO: Wait backend send the thumbnailUrl as prop
const Thumbnail = ({ loading, thumbnailUrl, cached }: { loading: boolean; thumbnailUrl?: string; cached: boolean }) => (
	<>
		{thumbnailUrl ? <FastImage style={styles.thumbnailImage} source={{ uri: thumbnailUrl }} /> : null}
		<BlurComponent
			iconName={cached ? 'play-filled' : 'arrow-down-circle'}
			loading={loading}
			style={styles.button}
			showOverlay={cached}
		/>
		{loading ? <CancelIndicator /> : null}
	</>
);

const Video = React.memo(
	({ file, showAttachment, getCustomEmoji, style, isReply }: IMessageVideo) => {
		const [videoCached, setVideoCached] = useState(file);
		const [loading, setLoading] = useState(true);
		const [cached, setCached] = useState(false);
		const { baseUrl, user } = useContext(MessageContext);
		const { theme } = useTheme();
		const video = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);

		useEffect(() => {
			const handleVideoSearchAndDownload = async () => {
				if (video) {
					const cachedVideoResult = await getMediaCache({
						type: 'video',
						mimeType: file.video_type,
						urlToCache: video
					});
					const downloadActive = isDownloadActive(video);
					if (cachedVideoResult?.exists) {
						setVideoCached(prev => ({
							...prev,
							video_url: cachedVideoResult?.uri
						}));
						setLoading(false);
						setCached(true);
						if (downloadActive) {
							cancelDownload(video);
						}
						return;
					}
					if (isReply) {
						setLoading(false);
						return;
					}
					await handleAutoDownload();
				}
			};
			handleVideoSearchAndDownload();
		}, []);

		if (!baseUrl) {
			return null;
		}

		const handleAutoDownload = async () => {
			const isAutoDownloadEnabled = fetchAutoDownloadEnabled('videoPreferenceDownload');
			if (isAutoDownloadEnabled && file.video_type && isTypeSupported(file.video_type)) {
				await handleDownload();
				return;
			}
			setLoading(false);
		};

		const handleDownload = async () => {
			setLoading(true);
			try {
				const videoUri = await downloadMediaFile({
					downloadUrl: video,
					type: 'video',
					mimeType: file.video_type
				});
				setVideoCached(prev => ({
					...prev,
					video_url: videoUri
				}));
				setCached(true);
			} catch {
				setCached(false);
			} finally {
				setLoading(false);
			}
		};

		const onPress = async () => {
			if (file.video_type && cached && isTypeSupported(file.video_type) && showAttachment) {
				showAttachment(videoCached);
				return;
			}
			if (!loading && !cached && file.video_type && isTypeSupported(file.video_type)) {
				handleDownload();
				return;
			}
			if (loading && !cached) {
				handleCancelDownload();
				return;
			}
			if (!isIOS && file.video_url) {
				await downloadVideoToGallery(video);
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Unsupported_format') });
		};

		const handleCancelDownload = () => {
			if (loading) {
				cancelDownload(video);
				setLoading(false);
			}
		};

		const downloadVideoToGallery = async (uri: string) => {
			setLoading(true);
			const fileDownloaded = await fileDownload(uri, file);
			setLoading(false);

			if (fileDownloaded) {
				EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('error-save-video') });
		};

		return (
			<>
				<Markdown
					msg={file.description}
					username={user.username}
					getCustomEmoji={getCustomEmoji}
					style={[isReply && style]}
					theme={theme}
				/>
				<Touchable
					disabled={isReply}
					onPress={onPress}
					style={[styles.button, messageStyles.mustWrapBlur, { backgroundColor: themes[theme].videoBackground }]}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
				>
					<Thumbnail loading={loading} cached={cached} />
				</Touchable>
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

export default Video;
