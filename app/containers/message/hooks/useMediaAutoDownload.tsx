import { useCallback, useContext, useEffect, useState } from 'react';

import { IAttachment, IUserMessage } from '../../../definitions';
import { isImageBase64 } from '../../../lib/methods';
import { fetchAutoDownloadEnabled } from '../../../lib/methods/autoDownloadPreference';
import {
	cancelDownload,
	downloadMediaFile,
	getMediaCache,
	isDownloadActive,
	MediaTypes,
	TDownloadState
} from '../../../lib/methods/handleMediaDownload';
import { emitter } from '../../../lib/methods/helpers';
import { formatAttachmentUrl } from '../../../lib/methods/helpers/formatAttachmentUrl';
import MessageContext from '../Context';
import { useFile } from './useFile';

const getFileType = (file: IAttachment): MediaTypes | null => {
	if (file.image_url) {
		return 'image';
	}
	if (file.video_url) {
		return 'video';
	}
	if (file.audio_url) {
		return 'audio';
	}
	return null;
};

const getFileProperty = (file: IAttachment, fileType: MediaTypes, property: 'url' | 'type') => {
	if (fileType && file[`${fileType}_${property}`]) {
		return file[`${fileType}_${property}`];
	}
};

export const useMediaAutoDownload = ({
	file,
	author,
	showAttachment
}: {
	file: IAttachment;
	author?: IUserMessage;
	showAttachment?: Function;
}) => {
	const fileType = getFileType(file) ?? 'image';
	const { id, baseUrl, user } = useContext(MessageContext);
	const [status, setStatus] = useState<TDownloadState>('to-download');
	const [currentFile, setCurrentFile] = useFile(file, id);
	const url = formatAttachmentUrl(file.title_link || getFileProperty(currentFile, fileType, 'url'), user.id, user.token, baseUrl);
	const isEncrypted = currentFile.e2e === 'pending';

	useEffect(() => {
		const handleCache = async () => {
			if (url) {
				const isCached = await checkCache();
				if (isCached) {
					return;
				}
				if (isDownloadActive(url)) {
					resumeDownload();
					return;
				}
				await tryAutoDownload();
			}
		};
		if (fileType === 'image' && isImageBase64(url)) {
			setStatus('downloaded');
		} else {
			handleCache();
		}

		return () => {
			emitter.off(`downloadMedia${url}`, downloadMediaListener);
		};
	}, []);

	const downloadMediaListener = useCallback((uri: string) => {
		updateCurrentFile(uri);
	}, []);

	const resumeDownload = () => {
		setStatus('loading');
		emitter.on(`downloadMedia${url}`, downloadMediaListener);
	};

	const tryAutoDownload = async () => {
		const isCurrentUserAuthor = author?._id === user.id;
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled(`${fileType}PreferenceDownload`);
		if (isAutoDownloadEnabled || isCurrentUserAuthor) {
			await download();
		} else {
			setStatus('to-download');
		}
	};

	const download = async () => {
		try {
			setStatus('loading');
			const uri = await downloadMediaFile({
				messageId: id,
				downloadUrl: url,
				type: fileType,
				mimeType: getFileProperty(currentFile, fileType, 'type'),
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateCurrentFile(uri);
		} catch (e) {
			setStatus('to-download');
		}
	};

	const updateCurrentFile = (uri: string) => {
		setCurrentFile({
			title_link: uri
		});
		setStatus('downloaded');
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
			type: fileType,
			mimeType: getFileProperty(currentFile, fileType, 'type'),
			urlToCache: url
		});
		if (result?.exists && !isEncrypted) {
			updateCurrentFile(result.uri);
		}
		return result?.exists;
	};

	const onPress = () => {
		if (status === 'loading') {
			cancelDownload(url);
			setStatus('to-download');
			return;
		}
		if (status === 'to-download') {
			download();
			return;
		}
		if (!showAttachment || !currentFile.title_link || isEncrypted) {
			return;
		}
		showAttachment(currentFile);
	};

	return {
		status,
		url,
		onPress,
		currentFile,
		isEncrypted
	};
};
