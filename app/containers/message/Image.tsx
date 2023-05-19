import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { dequal } from 'dequal';
import { createImageProgress } from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import { BlurView } from '@react-native-community/blur';

import Touchable from './Touchable';
import Markdown from '../markdown';
import styles from './styles';
import { themes } from '../../lib/constants';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import { TSupportedThemes, useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import {
	MediaTypes,
	cancelDownload,
	downloadMediaFile,
	isDownloadActive,
	searchMediaFileAsync
} from '../../lib/methods/handleMediaDownload';
import { isAutoDownloadEnabled } from './helpers/mediaDownload/autoDownloadPreference';
import RCActivityIndicator from '../ActivityIndicator';
import { CustomIcon } from '../CustomIcon';

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

const BlurComponent = ({ loading = false }: { loading: boolean }) => {
	const { theme, colors } = useTheme();

	return (
		<>
			<BlurView
				style={[styles.image, styles.imageBlur]}
				blurType={theme === 'light' ? 'light' : 'dark'}
				blurAmount={10}
				reducedTransparencyFallbackColor='white'
			/>
			<View style={[styles.image, styles.imageIndicator]}>
				{loading ? <RCActivityIndicator /> : <CustomIcon color={colors.buttonText} name='arrow-down-circle' size={54} />}
			</View>
		</>
	);
};

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
		const [newFile, setNewFile] = useState(file);
		const [toDownload, setToDownload] = useState(true);
		const [loading, setLoading] = useState(false);
		const { theme } = useTheme();
		const { baseUrl, user } = useContext(MessageContext);
		const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
		const filePath = useRef('');

		useLayoutEffect(() => {
			const handleAutoDownload = async () => {
				if (img) {
					const searchImageCached = await searchMediaFileAsync({
						type: MediaTypes.image,
						mimeType: newFile.image_type,
						messageId
					});
					filePath.current = searchImageCached.filePath;
					if (searchImageCached.file?.exists) {
						setNewFile(prev => ({
							...prev,
							title_link: searchImageCached.file?.uri
						}));
						return setToDownload(false);
					}

					if (isDownloadActive(MediaTypes.image, messageId)) {
						return setLoading(true);
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
			try {
				// The param file.title_link is the one that point to image with best quality, however we still need to test the imageUrl
				// And we don't have sure that ever exists the file.title_link
				const imgUrl = imageUrl || formatAttachmentUrl(newFile.title_link || newFile.image_url, user.id, user.token, baseUrl);
				const imageUri = await downloadMediaFile({
					downloadUrl: imgUrl,
					mediaType: MediaTypes.image,
					messageId,
					path: filePath.current
				});

				setNewFile(prev => ({
					...prev,
					title_link: imageUri
				}));
				setToDownload(false);
				setLoading(false);
			} catch (e) {
				setLoading(false);
				return setToDownload(true);
			}
		};

		const onPress = () => {
			if (loading && isDownloadActive(MediaTypes.image, messageId)) {
				cancelDownload(MediaTypes.image, messageId);
				setLoading(false);
				return setToDownload(true);
			}

			if (toDownload && !loading) {
				return handleDownload();
			}

			if (!showAttachment) {
				return;
			}

			return showAttachment(newFile);
		};

		if (newFile.description) {
			return (
				<Button disabled={isReply} theme={theme} onPress={onPress}>
					<View>
						<Markdown
							msg={newFile.description}
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
