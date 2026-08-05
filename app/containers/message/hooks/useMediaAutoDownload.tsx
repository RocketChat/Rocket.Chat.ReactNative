import { useCallback, useEffect, useReducer } from 'react';

import { type IAttachment, type IUserMessage } from '../../../definitions';
import { isImageBase64 } from '../../../lib/methods/isImageBase64';
import { fetchAutoDownloadEnabled } from '../../../lib/methods/autoDownloadPreference';
import {
	cancelDownload,
	downloadMediaFile,
	getMediaCache,
	isDownloadActive,
	type MediaTypes,
	type TDownloadState
} from '../../../lib/methods/handleMediaDownload';
import { emitter } from '../../../lib/methods/helpers/emitter';
import { formatAttachmentUrl } from '../../../lib/methods/helpers/formatAttachmentUrl';
import { useBaseUrl, useMessageUser } from '../stores/MessageRoomStore';
import { useMessageId } from '../stores/MessageStore';
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

const getOriginalURL = (file: IAttachment): string | null => {
	if (file.image_url) {
		return file.image_url;
	}
	if (file.video_url) {
		return file.video_url;
	}
	if (file.audio_url) {
		return file.audio_url;
	}
	return null;
};

export type TDownloadEvent = 'download_started' | 'download_succeeded' | 'download_failed' | 'download_canceled' | 'cache_hit';

export const downloadStatusReducer = (state: TDownloadState, event: TDownloadEvent): TDownloadState => {
	switch (event) {
		case 'download_started':
			return 'loading';
		case 'download_succeeded':
		case 'cache_hit':
			return 'downloaded';
		case 'download_failed':
		case 'download_canceled':
			return 'to-download';
		default:
			return state;
	}
};

export const useMediaAutoDownload = ({
	file,
	author,
	showAttachment
}: {
	file: IAttachment;
	author?: IUserMessage;
	showAttachment?: (file: IAttachment) => void;
}) => {
	const fileType = getFileType(file) ?? 'image';
	const id = useMessageId();
	const baseUrl = useBaseUrl();
	const user = useMessageUser();
	const [status, dispatchDownloadEvent] = useReducer(downloadStatusReducer, 'to-download');
	const [currentFile, setCurrentFile] = useFile(file);
	const originalUrl = getOriginalURL(file);
	const url = formatAttachmentUrl(
		file.title_link || getFileProperty(currentFile, fileType, 'url'),
		user?.id ?? '',
		user?.token ?? '',
		baseUrl ?? '',
		originalUrl
	);
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
			dispatchDownloadEvent('cache_hit');
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
		dispatchDownloadEvent('download_started');
		emitter.on(`downloadMedia${url}`, downloadMediaListener);
	};

	const tryAutoDownload = async () => {
		const isCurrentUserAuthor = author?._id === user?.id;
		const isAutoDownloadEnabled = fetchAutoDownloadEnabled(`${fileType}PreferenceDownload`);
		if (isAutoDownloadEnabled || isCurrentUserAuthor) {
			await download();
		}
	};

	const download = async () => {
		try {
			dispatchDownloadEvent('download_started');
			const uri = await downloadMediaFile({
				messageId: id ?? '',
				downloadUrl: url,
				type: fileType,
				mimeType: getFileProperty(currentFile, fileType, 'type'),
				encryption: file.encryption,
				originalChecksum: file.hashes?.sha256
			});
			setDecrypted();
			updateCurrentFile(uri);
		} catch (e) {
			dispatchDownloadEvent('download_failed');
		}
	};

	const updateCurrentFile = (uri: string) => {
		setCurrentFile({
			title_link: uri
		});
		dispatchDownloadEvent('download_succeeded');
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
			dispatchDownloadEvent('download_canceled');
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
