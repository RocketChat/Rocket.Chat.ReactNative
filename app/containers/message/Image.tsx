import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { dequal } from 'dequal';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import * as FileSystem from 'expo-file-system';

import Touchable from './Touchable';
import Markdown from '../markdown';
import styles from './styles';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import { TSupportedThemes, useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import { MediaTypes, downloadMediaFile, searchMediaFileAsync } from '../../lib/methods/handleMediaDownload';
import { isAutoDownloadEnabled } from './helpers/mediaDownload/autoDownloadPreference';
import BlurComponent from './Components/BlurComponent';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
	theme: TSupportedThemes;
}

interface IMessageImage {
	file: IAttachment;
	imageUrl?: string;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
	messageId: string;
}

const ImageProgress = createImageProgress(FastImage);

const Button = React.memo(({ children, onPress, disabled, theme }: IMessageButton) => (
	<Touchable
		disabled={disabled}
		onPress={onPress}
		style={styles.imageContainer}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		{children}
	</Touchable>
));

export const MessageImage = React.memo(
	({ imgUri, toDownload, loading }: { imgUri: string; toDownload: boolean; loading: boolean }) => {
		const { colors } = useTheme();

		return (
			<>
				<ImageProgress
					style={[styles.image, { borderColor: colors.borderColor }]}
					source={{ uri: encodeURI(imgUri) }}
					resizeMode={FastImage.resizeMode.cover}
					indicator={Progress.Pie}
					indicatorProps={{
						color: colors.actionTintColor
					}}
				/>
				{toDownload ? <BlurComponent loading={loading} /> : null}
			</>
		);
	}
);

const ImageContainer = React.memo(
	({ file, imageUrl, showAttachment, getCustomEmoji, style, isReply, author, messageId }: IMessageImage) => {
		const [toDownload, setToDownload] = useState(true);
		const [loading, setLoading] = useState(false);
		const { theme } = useTheme();
		const { baseUrl, user } = useContext(MessageContext);
		const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
		const filePath = useRef('');
		const downloadResumable = useRef<FileSystem.DownloadResumable | null>(null);

		useLayoutEffect(() => {
			const handleAutoDownload = async () => {
				if (img) {
					const searchImageBestQuality = await searchMediaFileAsync({
						type: MediaTypes.image,
						mimeType: file.image_type,
						messageId
					});
					filePath.current = searchImageBestQuality.filePath;
					if (searchImageBestQuality.file?.exists) {
						file.title_link = searchImageBestQuality.file.uri;
						return setToDownload(false);
					}

					const autoDownload = await isAutoDownloadEnabled('imagesPreferenceDownload', { user, author });
					if (autoDownload) {
						await handleDownload();
					}
				}
			};
			handleAutoDownload();
		}, []);

		if (!img) {
			return null;
		}

		const handleDownload = async () => {
			setLoading(true);
			const imgUrl = imageUrl || formatAttachmentUrl(file.title_link || file.image_url, user.id, user.token, baseUrl);
			downloadResumable.current = FileSystem.createDownloadResumable(imgUrl, filePath.current);
			const imageUri = await downloadMediaFile({
				url: imgUrl,
				filePath: filePath.current,
				downloadResumable: downloadResumable.current
			});
			if (!imageUri) {
				setLoading(false);
				return setToDownload(true);
			}
			file.title_link = imageUri;
			setToDownload(false);
			setLoading(false);
		};

		const onPress = () => {
			if (loading) {
				return downloadResumable.current?.cancelAsync();
			}

			if (toDownload && !loading) {
				return handleDownload();
			}

			if (!showAttachment) {
				return;
			}

			return showAttachment(file);
		};

		if (file.description) {
			return (
				<Button disabled={isReply} theme={theme} onPress={onPress}>
					<View>
						<Markdown
							msg={file.description}
							style={[isReply && style]}
							username={user.username}
							getCustomEmoji={getCustomEmoji}
							theme={theme}
						/>
						<MessageImage imgUri={img} toDownload={toDownload} loading={loading} />
					</View>
				</Button>
			);
		}

		return (
			<Button disabled={isReply} theme={theme} onPress={onPress}>
				<>
					<MessageImage imgUri={img} toDownload={toDownload} loading={loading} />
				</>
			</Button>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
