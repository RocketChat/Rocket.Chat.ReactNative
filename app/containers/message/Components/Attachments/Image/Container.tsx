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
	const [status, setStatus] = useState<TFileStatus>('not-cached');
	const { theme } = useTheme();
	const getUrl = (link?: string) => formatAttachmentUrl(link, user.id, user.token, baseUrl);
	const imageUrl = getUrl(currentFile.title_link || currentFile.image_url);
	const isEncrypted = currentFile.e2e === 'pending';

	useEffect(() => {
		const handleCache = async () => {
			if (imageUrl) {
				const isCached = await checkCache();
				if (isCached) {
					return;
				}
				if (isDownloadActive(imageUrl)) {
					resumeDownload();
					return;
				}
				await tryAutoDownload();
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

	const resumeDownload = () => {
		emitter.on(`downloadMedia${id}`, downloadMediaListener);
	};

	const tryAutoDownload = async () => {
		const isCurrentUserAuthor = author?._id === user.id;
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled('imagesPreferenceDownload');
		if (isAutoDownloadEnabled || isCurrentUserAuthor) {
			await download();
		} else {
			setStatus('not-cached');
		}
	};

	const download = async () => {
		try {
			setStatus('loading');
			const uri = await downloadMediaFile({
				messageId: id,
				downloadUrl: imageUrl,
				type: 'image',
				mimeType: currentFile.image_type,
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateCurrentFile(uri);
		} catch (e) {
			setStatus('not-cached');
		}
	};

	const updateCurrentFile = (uri: string) => {
		setCurrentFile({
			title_link: uri
		});
		setStatus('cached');
	};

	const setDecrypted = () => {
		if (isEncrypted) {
			setCurrentFile({
				e2e: 'done'
			});
		}
	};

	const checkCache = async () => {
		const result = await getMediaCache({
			type: 'image',
			mimeType: currentFile.image_type,
			urlToCache: imageUrl
		});
		if (result?.exists && !isEncrypted) {
			updateCurrentFile(result.uri);
		}
		return result?.exists;
	};

	const onPress = () => {
		if (status === 'loading') {
			cancelDownload(imageUrl);
			setStatus('not-cached');
			return;
		}
		if (status === 'not-cached') {
			download();
			return;
		}
		if (!showAttachment || !currentFile.title_link || isEncrypted) {
			return;
		}
		showAttachment(currentFile);
	};

	const image = (
		<Button onPress={onPress}>
			<MessageImage uri={imageUrl} status={status} encrypted={isEncrypted} />
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
