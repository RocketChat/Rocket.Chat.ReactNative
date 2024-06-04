import React, { useContext, useEffect, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { Encryption } from '../../../../lib/encryption';
import { IAttachment, IUserMessage } from '../../../../definitions';
import { TGetCustomEmoji } from '../../../../definitions/IEmoji';
import { fetchAutoDownloadEnabled } from '../../../../lib/methods/autoDownloadPreference';
import {
	cancelDownload,
	downloadMediaFile,
	getMediaCache,
	isDownloadActive,
	resumeMediaFile
} from '../../../../lib/methods/handleMediaDownload';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';
import { useTheme } from '../../../../theme';
import Markdown from '../../../markdown';
import BlurComponent from '../OverlayComponent';
import MessageContext from '../../Context';
import Touchable from '../../Touchable';
import styles from '../../styles';
import { isImageBase64 } from '../../../../lib/methods';

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

		if (encrypted) {
			return (
				<>
					<View style={styles.image} />
					<BlurComponent loading={false} style={[styles.image, styles.imageBlurContainer]} iconName='encrypted' />
				</>
			);
		}

		return (
			<>
				<FastImage
					style={[styles.image, { borderColor: colors.strokeLight }]}
					source={{ uri: encodeURI(imgUri) }}
					resizeMode={FastImage.resizeMode.cover}
				/>
				{!cached ? (
					<BlurComponent loading={loading} style={[styles.image, styles.imageBlurContainer]} iconName='arrow-down-circle' />
				) : null}
			</>
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
	const [imageCached, setImageCached] = useState(file);
	const [cached, setCached] = useState(false);
	const [loading, setLoading] = useState(true);
	const { theme } = useTheme();
	const { id, baseUrl, user } = useContext(MessageContext);
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
				setLoading(false);
				await handleAutoDownload();
			}
		};
		if (isImageBase64(imgUrlToCache)) {
			setLoading(false);
			setCached(true);
		} else {
			handleCache();
		}
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
		setImageCached(prev => ({
			...prev,
			title_link: imgUri
		}));
		setCached(true);
	};

	const handleGetMediaCache = async () => {
		const cachedImageResult = await getMediaCache({
			type: 'image',
			mimeType: imageCached.image_type,
			urlToCache: imgUrlToCache
		});
		if (cachedImageResult?.exists) {
			if (file.encryption && file.e2e === 'pending') {
				await Encryption.decryptFile(id, cachedImageResult.uri, file.encryption);
			}
			updateImageCached(cachedImageResult.uri);
			setLoading(false);
		}
		return !!cachedImageResult?.exists;
	};

	const handleResumeDownload = async () => {
		try {
			setLoading(true);
			const imageUri = await resumeMediaFile({
				downloadUrl: imgUrlToCache
			});
			updateImageCached(imageUri);
		} catch (e) {
			setCached(false);
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = async () => {
		try {
			setLoading(true);
			const imageUri = await downloadMediaFile({
				messageId: id,
				downloadUrl: imgUrlToCache,
				type: 'image',
				mimeType: imageCached.image_type,
				encryption: file.encryption
			});
			updateImageCached(imageUri);
		} catch (e) {
			setCached(false);
		} finally {
			setLoading(false);
		}
	};

	const onPress = async () => {
		if (file.e2e === 'pending') {
			alert('File is encrypted. tbd');
			return;
		}
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
			handleDownload();
			return;
		}
		if (!showAttachment) {
			return;
		}
		showAttachment(imageCached);
	};

	const image = (
		<Button onPress={onPress}>
			<MessageImage
				imgUri={file.encryption && imageCached.title_link ? imageCached.title_link : img}
				cached={cached}
				loading={loading}
				encrypted={file.e2e === 'pending'}
			/>
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
