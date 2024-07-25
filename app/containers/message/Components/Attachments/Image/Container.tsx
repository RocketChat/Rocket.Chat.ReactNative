import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';

import { isImageBase64 } from '../../../../../lib/methods';
import { fetchAutoDownloadEnabled } from '../../../../../lib/methods/autoDownloadPreference';
import {
	cancelDownload,
	downloadMediaFile,
	getMediaCache,
	isDownloadActive
} from '../../../../../lib/methods/handleMediaDownload';
import { emitter } from '../../../../../lib/methods/helpers';
import { formatAttachmentUrl } from '../../../../../lib/methods/helpers/formatAttachmentUrl';
import { useTheme } from '../../../../../theme';
import Markdown from '../../../../markdown';
import MessageContext from '../../../Context';
import { useFile } from '../../../hooks/useFile';
import { Button } from './Button';
import { MessageImage } from './Image';
import { IImageContainer, TFileStatus } from './definitions';

const ImageContainer = ({
	file,
	showAttachment,
	getCustomEmoji,
	style,
	isReply,
	author,
	msg
}: IImageContainer): React.ReactElement | null => {
	const { id, baseUrl, user } = useContext(MessageContext);
	const [currentFile, setCurrentFile] = useFile(file, id);
	const [status, setStatus] = useState<TFileStatus>('loading');
	const { theme } = useTheme();
	const getUrl = (link?: string) => formatAttachmentUrl(link, user.id, user.token, baseUrl);
	const imageUrl = getUrl(currentFile.title_link || currentFile.image_url);

	useEffect(() => {
		const handleCache = async () => {
			if (imageUrl) {
				const isImageCached = await handleGetMediaCache();
				if (isImageCached) {
					return;
				}
				if (isDownloadActive(imageUrl)) {
					handleResumeDownload();
					return;
				}
				await handleAutoDownload();
			}
		};
		if (isImageBase64(imageUrl)) {
			setStatus('cached');
		} else {
			handleCache();
		}

		return () => {
			emitter.off(`downloadMedia${id}`, downloadMediaListener);
		};
	}, []);

	const downloadMediaListener = useCallback((imageUri: string) => {
		updateCurrentFile(imageUri);
	}, []);

	if (!imageUrl) {
		return null;
	}

	const handleAutoDownload = async () => {
		const isCurrentUserAuthor = author?._id === user.id;
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled('imagesPreferenceDownload');
		if (isAutoDownloadEnabled || isCurrentUserAuthor) {
			await handleDownload();
		} else {
			setStatus('not-cached');
		}
	};

	const updateCurrentFile = (imgUri: string) => {
		setCurrentFile({
			title_link: imgUri
		});
		setStatus('cached');
	};

	const setDecrypted = () => {
		if (currentFile.e2e === 'pending') {
			setCurrentFile({
				e2e: 'done'
			});
		}
	};

	const handleGetMediaCache = async () => {
		const cachedImageResult = await getMediaCache({
			type: 'image',
			mimeType: currentFile.image_type,
			urlToCache: imageUrl
		});
		const result = !!cachedImageResult?.exists && currentFile.e2e !== 'pending';
		if (result) {
			updateCurrentFile(cachedImageResult.uri);
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
				downloadUrl: imageUrl,
				type: 'image',
				mimeType: currentFile.image_type,
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateCurrentFile(imageUri);
		} catch (e) {
			setStatus('not-cached');
		}
	};

	const onPress = async () => {
		if (status === 'loading' && isDownloadActive(imageUrl)) {
			cancelDownload(imageUrl);
			setStatus('not-cached');
			return;
		}
		if (status === 'not-cached') {
			const isImageCached = await handleGetMediaCache();
			if (isImageCached && showAttachment) {
				showAttachment(currentFile);
				return;
			}
			if (isDownloadActive(imageUrl)) {
				handleResumeDownload();
				return;
			}
			setStatus('loading');
			handleDownload();
			return;
		}
		if (!showAttachment || !currentFile.title_link) {
			return;
		}
		showAttachment(currentFile);
	};

	const image = (
		<Button onPress={onPress}>
			<MessageImage uri={imageUrl} status={status} encrypted={currentFile.e2e === 'pending'} />
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

export default ImageContainer;
