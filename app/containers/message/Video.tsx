import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View, Text } from 'react-native';
import { dequal } from 'dequal';
import * as FileSystem from 'expo-file-system';

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
import { MediaTypes, downloadMediaFile, searchMediaFileAsync } from '../../lib/methods/handleMediaDownload';
import { isAutoDownloadEnabled } from './helpers/mediaDownload/autoDownloadPreference';
import sharedStyles from '../../views/Styles';
import userPreferences from '../../lib/methods/userPreferences';

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
	messageId: string;
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
			<RCActivityIndicator />
		</>
	);
};

const downloadResumableKey = (video: string) => `DownloadResumable${video}`;

const Video = React.memo(
	({ file, showAttachment, getCustomEmoji, style, isReply, messageId }: IMessageVideo) => {
		const [loading, setLoading] = useState(false);
		const { baseUrl, user } = useContext(MessageContext);
		const { theme } = useTheme();
		const filePath = useRef('');
		const downloadResumable = useRef<FileSystem.DownloadResumable | null>(null);
		const video = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);

		useLayoutEffect(() => {
			const handleAutoDownload = async () => {
				if (video) {
					const searchVideoCached = await searchMediaFileAsync({
						type: MediaTypes.video,
						mimeType: file.video_type,
						messageId
					});
					filePath.current = searchVideoCached.filePath;
					handleDownloadResumableSnapshot();
					if (searchVideoCached.file?.exists) {
						file.video_url = searchVideoCached.file.uri;
						return;
					}

					// We don't pass the author to avoid auto-download what the user sent
					const autoDownload = await isAutoDownloadEnabled('imagesPreferenceDownload', { user });
					if (autoDownload && !downloadResumable.current) {
						await handleDownload();
					}
				}
			};
			handleAutoDownload();
		}, []);

		if (!baseUrl) {
			return null;
		}

		const handleDownloadResumableSnapshot = () => {
			if (video) {
				const result = userPreferences.getString(downloadResumableKey(video));
				if (result) {
					const snapshot = JSON.parse(result);
					downloadResumable.current = new FileSystem.DownloadResumable(
						video,
						filePath.current,
						{},
						() => {},
						snapshot.resumeData
					);
					setLoading(true);
				}
			}
		};

		const handleDownload = async () => {
			setLoading(true);
			downloadResumable.current = FileSystem.createDownloadResumable(video, filePath.current);
			userPreferences.setString(downloadResumableKey(video), JSON.stringify(downloadResumable.current.savable()));
			const videoUri = await downloadMediaFile({
				url: video,
				filePath: filePath.current,
				downloadResumable: downloadResumable.current
			});
			userPreferences.removeItem(downloadResumableKey(video));
			if (videoUri) {
				file.video_url = videoUri;
			}
			setLoading(false);
		};

		const onPress = async () => {
			if (file.video_type && isTypeSupported(file.video_type) && showAttachment) {
				// Keep the video downloading while showing the video buffering
				handleDownload();
				return showAttachment(file);
			}

			if (!isIOS && file.video_url) {
				await downloadVideoToGallery(video);
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Unsupported_format') });
		};

		const handleCancelDownload = () => {
			if (loading && downloadResumable.current) {
				downloadResumable.current.cancelAsync();
				userPreferences.removeItem(downloadResumableKey(video));
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
