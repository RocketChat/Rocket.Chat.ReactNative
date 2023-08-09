import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { dequal } from 'dequal';

import Touchable from './Touchable';
import Markdown from '../markdown';
import styles from './styles';
import MessageContext from './Context';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IAttachment, IUserMessage } from '../../definitions';
import { useTheme } from '../../theme';
import { formatAttachmentUrl } from '../../lib/methods/helpers/formatAttachmentUrl';
import { cancelDownload, downloadMediaFile, isDownloadActive, getMediaCache } from '../../lib/methods/handleMediaDownload';
import { fetchAutoDownloadEnabled } from '../../lib/methods/autoDownloadPreference';
import BlurComponent from './Components/BlurComponent';

interface IMessageButton {
	children: React.ReactElement;
	disabled?: boolean;
	onPress: () => void;
}

interface IMessageImage {
	file: IAttachment;
	imageUrl?: string;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
}

const Button = React.memo(({ children, onPress, disabled }: IMessageButton) => {
	const { colors } = useTheme();
	return (
		<Touchable
			disabled={disabled}
			onPress={onPress}
			style={[styles.imageContainer, styles.mustWrapBlur]}
			background={Touchable.Ripple(colors.bannerBackground)}
		>
			{children}
		</Touchable>
	);
});

export const MessageImage = React.memo(({ imgUri, cached, loading }: { imgUri: string; cached: boolean; loading: boolean }) => {
	const { colors } = useTheme();
	return (
		<>
			<FastImage
				style={[styles.image, { borderColor: colors.borderColor }]}
				source={{ uri: encodeURI(imgUri) }}
				resizeMode={FastImage.resizeMode.cover}
			/>
			{!cached ? (
				<BlurComponent loading={loading} style={[styles.image, styles.imageBlurContainer]} iconName='arrow-down-circle' />
			) : null}
		</>
	);
});

const ImageContainer = React.memo(
	({ file, imageUrl, showAttachment, getCustomEmoji, style, isReply, author }: IMessageImage) => {
		const [imageCached, setImageCached] = useState(file);
		const [cached, setCached] = useState(false);
		const [loading, setLoading] = useState(true);
		const { theme } = useTheme();
		const { baseUrl, user } = useContext(MessageContext);
		const getUrl = (link?: string) => imageUrl || formatAttachmentUrl(link, user.id, user.token, baseUrl);
		const img = getUrl(file.image_url);
		// The param file.title_link is the one that point to image with best quality, however we still need to test the imageUrl
		// And we cannot be certain whether the file.title_link actually exists.
		const imgUrlToCache = getUrl(imageCached.title_link || imageCached.image_url);

		useEffect(() => {
			const handleCache = async () => {
				if (img) {
					const cachedImageResult = await getMediaCache({
						type: 'image',
						mimeType: imageCached.image_type,
						urlToCache: imgUrlToCache
					});
					if (cachedImageResult?.exists) {
						setImageCached(prev => ({
							...prev,
							title_link: cachedImageResult?.uri
						}));
						setLoading(false);
						setCached(true);
						return;
					}
					if (isReply) {
						setLoading(false);
						return;
					}
					if (isDownloadActive(imgUrlToCache)) {
						return;
					}
					setLoading(false);
					await handleAutoDownload();
				}
			};
			handleCache();
		}, []);

		if (!img) {
			return null;
		}

		const handleAutoDownload = async () => {
			const isCurrentUserAuthor = author?._id === user.id;
			const isAutoDownloadEnabled = fetchAutoDownloadEnabled('imagesPreferenceDownload');
			if (isAutoDownloadEnabled || isCurrentUserAuthor) {
				await handleDownload();
			}
		};

		const handleDownload = async () => {
			try {
				setLoading(true);
				const imageUri = await downloadMediaFile({
					downloadUrl: imgUrlToCache,
					type: 'image',
					mimeType: imageCached.image_type
				});
				setImageCached(prev => ({
					...prev,
					title_link: imageUri
				}));
				setCached(true);
			} catch (e) {
				setCached(false);
			} finally {
				setLoading(false);
			}
		};

		const onPress = () => {
			if (loading && isDownloadActive(imgUrlToCache)) {
				cancelDownload(imgUrlToCache);
				setLoading(false);
				setCached(false);
				return;
			}
			if (!cached && !loading) {
				handleDownload();
				return;
			}
			if (!showAttachment) {
				return;
			}
			showAttachment(imageCached);
		};

		if (imageCached.description) {
			return (
				<View>
					<Markdown
						msg={imageCached.description}
						style={[isReply && style]}
						username={user.username}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
					/>
					<Button disabled={isReply} onPress={onPress}>
						<MessageImage imgUri={img} cached={cached} loading={loading} />
					</Button>
				</View>
			);
		}

		return (
			<Button disabled={isReply} onPress={onPress}>
				<MessageImage imgUri={img} cached={cached} loading={loading} />
			</Button>
		);
	},
	(prevProps, nextProps) => dequal(prevProps.file, nextProps.file)
);

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
