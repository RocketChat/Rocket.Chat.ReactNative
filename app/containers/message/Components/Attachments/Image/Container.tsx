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
	const img = getUrl(file.image_url);
	const imgUrlToCache = getUrl(currentFile.title_link || currentFile.image_url);

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
			}
		};
		if (isImageBase64(imgUrlToCache)) {
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
			urlToCache: imgUrlToCache
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
				downloadUrl: imgUrlToCache,
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
		if (status === 'loading' && isDownloadActive(imgUrlToCache)) {
			cancelDownload(imgUrlToCache);
			setStatus('not-cached');
			return;
		}
		if (status === 'not-cached') {
			const isImageCached = await handleGetMediaCache();
			if (isImageCached && showAttachment) {
				showAttachment(currentFile);
				return;
			}
			if (isDownloadActive(imgUrlToCache)) {
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
			<MessageImage
				uri={file.encryption && currentFile.title_link ? currentFile.title_link : img}
				status={status}
				encrypted={currentFile.e2e === 'pending'}
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

export default ImageContainer;
