import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { dequal } from 'dequal';
import * as VideoThumbnails from 'expo-video-thumbnails';
import FastImage from 'react-native-fast-image';

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

const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
const isTypeSupported = (type: string) => SUPPORTED_TYPES.indexOf(type) !== -1;

const styles = StyleSheet.create({
	button: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	thumbnailImage: {
		width: '100%',
		height: '100%',
		borderRadius: 4,
		borderWidth: 1,
		overflow: 'hidden',
		position: 'absolute',
		opacity: 0.6
	},
	container: {
		height: 150,
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

interface IMessageVideo {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji: TGetCustomEmoji;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
}

const Video = React.memo(
	({ file, showAttachment, getCustomEmoji, style, isReply }: IMessageVideo) => {
		const { baseUrl, user } = useContext(MessageContext);
		const [loading, setLoading] = useState(false);
		const { theme } = useTheme();
		const [thumbnailImage, setThumbnailImage] = useState('');

		useEffect(() => {
			getThumbnail();
		}, []);

		if (!baseUrl) {
			return null;
		}

		const onPress = async () => {
			if (file.video_type && isTypeSupported(file.video_type) && showAttachment) {
				return showAttachment(file);
			}

			if (!isIOS && file.video_url) {
				const uri = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);
				await downloadVideo(uri);
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('Unsupported_format') });
		};

		const downloadVideo = async (uri: string) => {
			setLoading(true);
			const fileDownloaded = await fileDownload(uri, file);
			setLoading(false);

			if (fileDownloaded) {
				EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
				return;
			}
			EventEmitter.emit(LISTENER, { message: I18n.t('error-save-video') });
		};

		const getThumbnail = async () => {
			if (file.video_url) {
				const url = formatAttachmentUrl(file.video_url, user.id, user.token, baseUrl);
				try {
					const { uri } = await VideoThumbnails.getThumbnailAsync(url, {
						quality: 0.3
					});
					setThumbnailImage(uri);
				} catch (e) {
					console.warn(e);
				}
			}
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
					<View style={styles.container}>
						<FastImage source={{ uri: thumbnailImage }} resizeMode={FastImage.resizeMode.cover} style={[styles.thumbnailImage]} />
						{loading ? <RCActivityIndicator /> : <CustomIcon name='play-filled' size={54} color={themes[theme].buttonText} />}
					</View>
				</Touchable>
			</>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

export default Video;
