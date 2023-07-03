import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, Text } from 'react-native';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import Markdown from '../markdown';
import { isIOS } from '../../lib/methods/helpers';
import { CustomIcon } from '../CustomIcon';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { fileDownload } from './helpers/fileDownload';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../Toast';
import I18n from '../../i18n';
import { IAttachment } from '../../definitions/IAttachment';
import RCActivityIndicator from '../ActivityIndicator';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import {
	LOCAL_DOCUMENT_DIRECTORY,
	cancelDownload,
	downloadMediaFile,
	isDownloadActive,
	getMediaCache
} from '../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import sharedStyles from '../../views/Styles';

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
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
}

const DownloadIndicator = ({ handleCancelDownload }: { handleCancelDownload(): void }) => {
	const { colors } = useTheme();
	return (
		<>
			<View style={styles.cancelContainer}>
				<Touchable background={Touchable.Ripple(colors.bannerBackground)} onPress={handleCancelDownload}>
					<Text style={[styles.text, { color: colors.auxiliaryText }]}>{I18n.t('Cancel')}</Text>
				</Touchable>
			</View>
			<RCActivityIndicator size={48} />
		</>
	);
};

const Video = React.memo(
	({ file, showAttachment, getCustomEmoji, style, isReply }: IMessageVideo) => {
		const [videoCached, setVideoCached] = useState(file);
		const [loading, setLoading] = useState(false);
		const { baseUrl, user } = useContext(MessageContext);
		const { theme } = useTheme();
		const filePath = useRef('');
		const video = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);

		useEffect(() => {
			const handleVideoSearchAndDownload = async () => {
				if (video) {
					const cachedVideoResult = await getMediaCache({
						type: 'video',
						mimeType: file.video_type,
						urlToCache: video
					});
					filePath.current = cachedVideoResult.filePath;
					const downloadActive = isDownloadActive(video);
					if (cachedVideoResult.file?.exists) {
						setVideoCached(prev => ({
							...prev,
							video_url: cachedVideoResult.file?.uri
						}));
						if (downloadActive) {
							cancelDownload(video);
						}
						return;
					}
					if (isReply) return;
					if (downloadActive) return setLoading(true);
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
			if (isAutoDownloadEnabled) {
				await handleDownload();
			}
		};

		const handleDownload = async () => {
			setLoading(true);
			try {
				const videoUri = await downloadMediaFile({
					downloadUrl: video,
					path: filePath.current
				});
				setVideoCached(prev => ({
					...prev,
					video_url: videoUri
				}));
			} finally {
				setLoading(false);
			}
		};

		const onPress = async () => {
			if (file.video_type && isTypeSupported(file.video_type) && showAttachment) {
				if (LOCAL_DOCUMENT_DIRECTORY && !videoCached.video_url?.startsWith(LOCAL_DOCUMENT_DIRECTORY) && !loading) {
					// Keep the video downloading while showing the video buffering
					handleDownload();
				}
				return showAttachment(videoCached);
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
				return setLoading(false);
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
					style={[styles.button, { backgroundColor: themes[theme].videoBackground }]}
					background={Touchable.Ripple(themes[theme].bannerBackground)}
				>
					{loading ? (
						<DownloadIndicator handleCancelDownload={handleCancelDownload} />
					) : (
						<CustomIcon name='play-filled' size={54} color={themes[theme].buttonText} />
					)}
				</Touchable>
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

export default Video;
