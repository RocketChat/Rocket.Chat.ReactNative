import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StyleProp, TextStyle, View, Image, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';

import { emitter } from '../../../../lib/methods/helpers';
import { IAttachment, IUserMessage } from '../../../../definitions';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import { cancelDownload, downloadMediaFile, getMediaCache, isDownloadActive } from '../../../../lib/methods/handleMediaDownload';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';
import { useTheme } from '../../../../theme';
import Markdown from '../../../markdown';
import BlurComponent from '../OverlayComponent';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import styles from '../../styles';
import { isImageBase64 } from '../../../../lib/methods';
import { isValidUrl } from '../../../../lib/methods/helpers/isValidUrl';
import { useFile } from '../../hooks/useFile';
import { WidthAwareContext, WidthAwareView } from '../WidthAwareView';

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
	msg?: string;
}

const Button = React.memo(({ children, onPress, disabled }: IMessageButton) => {
	const { colors } = useTheme();
	return (
		<Touchable
			disabled={disabled}
			onPress={onPress}
			style={styles.imageContainer}
			background={Touchable.Ripple(colors.surfaceNeutral)}>
			{children}
		</Touchable>
	);
});

export const MessageImage = React.memo(
	({ imgUri, cached, loading, encrypted = false }: { imgUri: string; cached: boolean; loading: boolean; encrypted: boolean }) => {
		const { colors } = useTheme();
		const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
		const valid = isValidUrl(imgUri);
		const encryptedState = encrypted && !loading && cached;
		const maxSize = useContext(WidthAwareContext);

		useEffect(() => {
			if (valid && !encryptedState) {
				Image.getSize(imgUri, (width, height) => {
					setImageDimensions({ width, height });
				});
			}
		}, [imgUri, valid, encryptedState]);

		const width = Math.min(imageDimensions.width, maxSize);
		const height = Math.min((imageDimensions.height * ((width * 100) / imageDimensions.width)) / 100, maxSize);
		const imageStyle = {
			width,
			height
		};

		const containerStyle: ViewStyle = {
			borderColor: colors.strokeLight,
			borderWidth: 1,
			borderRadius: 4,
			alignItems: 'center',
			justifyContent: 'center',
			...(imageDimensions.width <= 64 && { width: 64 }),
			...(imageDimensions.height <= 64 && { height: 64 })
		};

		if (encryptedState) {
			return (
				<View style={containerStyle}>
					<View style={imageStyle} />
					<BlurComponent loading={false} style={[imageStyle, styles.imageBlurContainer]} iconName='encrypted' />
				</View>
			);
		}

		if (!imageDimensions.width || !maxSize) {
			return null;
		}

		return (
			<View style={containerStyle}>
				{valid ? <FastImage style={imageStyle} source={{ uri: encodeURI(imgUri) }} /> : <View style={imageStyle} />}
				{!cached ? (
					<BlurComponent loading={loading} style={[imageStyle, styles.imageBlurContainer]} iconName='arrow-down-circle' />
				) : null}
			</View>
		);
	}
);

const ImageContainer = ({
	file,
	imageUrl,
	showAttachment,
	getCustomEmoji,
	style,
	isReply,
	author,
	msg
}: IMessageImage): React.ReactElement | null => {
	const { id, baseUrl, user } = useContext(MessageContext);
	const [imageCached, setImageCached] = useFile(file, id);
	const [cached, setCached] = useState(false);
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();
	const getUrl = (link?: string) => imageUrl || formatAttachmentUrl(link, user.id, user.token, baseUrl);
	const img = getUrl(file.image_url);
	// The param file.title_link is the one that point to image with best quality, however we still need to test the imageUrl
	// And we cannot be certain whether the file.title_link actually exists.
	const imgUrlToCache = getUrl(imageCached.title_link || imageCached.image_url);

	useEffect(() => {
		const handleCache = async () => {
			if (img) {
				const isImageCached = await handleGetMediaCache();
				if (isImageCached) {
					return;
				}
				if (isDownloadActive(imgUrlToCache)) {
					handleResumeDownload();
					return;
				}
				await handleAutoDownload();
				setLoading(false);
			}
		};
		if (isImageBase64(imgUrlToCache)) {
			setLoading(false);
			setCached(true);
		} else {
			handleCache();
		}

		return () => {
			emitter.off(`downloadMedia${id}`, downloadMediaListener);
		};
	}, []);

	const downloadMediaListener = useCallback((imageUri: string) => {
		updateImageCached(imageUri);
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

	const updateImageCached = (imgUri: string) => {
		setImageCached({
			title_link: imgUri
		});
		setCached(true);
	};

	const setDecrypted = () => {
		if (imageCached.e2e === 'pending') {
			setImageCached({
				e2e: 'done'
			});
		}
	};

	const handleGetMediaCache = async () => {
		const cachedImageResult = await getMediaCache({
			type: 'image',
			mimeType: imageCached.image_type,
			urlToCache: imgUrlToCache
		});
		const result = !!cachedImageResult?.exists && imageCached.e2e !== 'pending';
		if (result) {
			updateImageCached(cachedImageResult.uri);
		}
		return result;
	};

	const handleResumeDownload = () => {
		emitter.on(`downloadMedia${id}`, downloadMediaListener);
	};

	const handleDownload = async () => {
		try {
			const imageUri = await downloadMediaFile({
				messageId: id,
				downloadUrl: imgUrlToCache,
				type: 'image',
				mimeType: imageCached.image_type,
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateImageCached(imageUri);
		} catch (e) {
			setCached(false);
			setLoading(false);
		}
	};

	const onPress = async () => {
		if (loading && isDownloadActive(imgUrlToCache)) {
			cancelDownload(imgUrlToCache);
			setLoading(false);
			setCached(false);
			return;
		}
		if (!cached && !loading) {
			const isImageCached = await handleGetMediaCache();
			if (isImageCached && showAttachment) {
				showAttachment(imageCached);
				return;
			}
			if (isDownloadActive(imgUrlToCache)) {
				handleResumeDownload();
				return;
			}
			setLoading(true);
			handleDownload();
			return;
		}
		if (!showAttachment || !imageCached.title_link) {
			return;
		}
		showAttachment(imageCached);
	};

	const image = (
		<Button onPress={onPress}>
			<WidthAwareView>
				<MessageImage
					imgUri={file.encryption && imageCached.title_link ? imageCached.title_link : img}
					cached={cached}
					loading={loading}
					encrypted={imageCached.e2e === 'pending'}
				/>
			</WidthAwareView>
		</Button>
	);

	if (msg) {
		return (
			<View>
				<Markdown msg={msg} style={[isReply && style]} username={user.username} getCustomEmoji={getCustomEmoji} theme={theme} />
				{image}
			</View>
		);
	}

	return image;
};

ImageContainer.displayName = 'MessageImageContainer';
MessageImage.displayName = 'MessageImage';

export default ImageContainer;
