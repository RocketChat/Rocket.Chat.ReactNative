import * as FileSystem from 'expo-file-system';
import * as mime from 'react-native-mime-types';
import { isEmpty } from 'lodash';

import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';

export type MediaTypes = 'audio' | 'image' | 'video';

const defaultType = {
	audio: 'mp3',
	image: 'jpg',
	video: 'mp4'
};

export const LOCAL_DOCUMENT_DIRECTORY = FileSystem.documentDirectory;

const sanitizeString = (value: string) => {
	const urlWithoutQueryString = value.split('?')[0];
	return sanitizeLikeString(urlWithoutQueryString.substring(urlWithoutQueryString.lastIndexOf('/') + 1));
};

const serverUrlParsedAsPath = (serverURL: string) => `${sanitizeString(serverURL)}/`;

const sanitizeFileName = (value: string) => {
	const extension = value.substring(value.lastIndexOf('.') + 1);
	const toSanitize = value.substring(0, value.lastIndexOf('.'));
	return `${sanitizeString(toSanitize)}.${extension}`;
};

export const getFilename = ({
	title,
	url,
	type,
	mimeType
}: {
	title?: string;
	url?: string;
	type: MediaTypes;
	mimeType?: string;
}) => {
	const isTitleTyped = mime.lookup(title);
	const extension = getExtension(type, mimeType);
	if (isTitleTyped && title) {
		if (isTitleTyped === mimeType) {
			return title;
		}
		// removing any character sequence after the last dot
		const filenameWithoutWrongExtension = title.replace(/\.\w+$/, '');
		return `${filenameWithoutWrongExtension}.${extension}`;
	}

	const filenameFromUrl = url?.substring(url.lastIndexOf('/') + 1);
	const isFileNameFromUrlTyped = mime.lookup(filenameFromUrl);
	if (isFileNameFromUrlTyped && filenameFromUrl) {
		if (isFileNameFromUrlTyped === mimeType) {
			return filenameFromUrl;
		}
		// removing any character sequence after the last dot
		const filenameWithoutWrongExtension = filenameFromUrl.replace(/\.\w+$/, '');
		return `${filenameWithoutWrongExtension}.${extension}`;
	}

	return `${filenameFromUrl}.${extension}`;
};

const getExtension = (type: MediaTypes, mimeType?: string) => {
	if (!mimeType) {
		return defaultType[type];
	}
	// The library is returning mpag instead of mp3 for audio/mpeg
	if (mimeType === 'audio/mpeg') {
		return 'mp3';
	}
	// Audios sent by Android devices are in the audio/aac format, which cannot be converted to mp3 by iOS.
	// However, both platforms support the m4a format, so they can maintain the same behavior.
	if (mimeType === 'audio/aac') {
		return 'm4a';
	}
	// The return of mime.extension('video/quicktime') is .qt,
	// this format the iOS isn't recognize and can't save on gallery
	if (mimeType === 'video/quicktime') {
		return 'mov';
	}
	const extension = mime.extension(mimeType);
	// The mime.extension can return false when there aren't any extension
	if (!extension) {
		return defaultType[type];
	}
	return extension;
};

const ensureDirAsync = async (dir: string, intermediates = true): Promise<void> => {
	const info = await FileSystem.getInfoAsync(dir);
	if (info.exists && info.isDirectory) {
		return;
	}
	await FileSystem.makeDirectoryAsync(dir, { intermediates });
	return ensureDirAsync(dir, intermediates);
};

const getFilePath = ({ type, mimeType, urlToCache }: { type: MediaTypes; mimeType?: string; urlToCache?: string }) => {
	if (!urlToCache) {
		return;
	}
	const folderPath = getFolderPath(urlToCache);
	const urlWithoutQueryString = urlToCache.split('?')[0];
	const filename = sanitizeFileName(getFilename({ type, mimeType, url: urlWithoutQueryString }));
	const filePath = `${folderPath}${filename}`;
	return filePath;
};

const getFolderPath = (fileUrl: string) => {
	const serverUrl = store.getState().server.server;
	const serverUrlParsed = serverUrlParsedAsPath(serverUrl);
	const fileUrlWithoutQueryString = fileUrl.split('?')[0];
	const fileUrlSplitted = fileUrlWithoutQueryString.split('/');
	const messageId = fileUrlSplitted[fileUrlSplitted.length - 2];
	const folderPath = `${LOCAL_DOCUMENT_DIRECTORY}${serverUrlParsed}${messageId}/`;
	return folderPath;
};

export const getFileInfoAsync = async (filePath: string) => {
	const file = await FileSystem.getInfoAsync(filePath);
	return file;
};

export const getMediaCache = async ({
	type,
	mimeType,
	urlToCache
}: {
	type: MediaTypes;
	mimeType?: string;
	urlToCache?: string;
}) => {
	if (!urlToCache) {
		return null;
	}
	try {
		const folderPath = getFolderPath(urlToCache);
		const filePath = getFilePath({ type, mimeType, urlToCache });
		if (!filePath) {
			return null;
		}
		await ensureDirAsync(folderPath);
		const file = await getFileInfoAsync(filePath);
		return file;
	} catch (error) {
		log(error);
		return null;
	}
};

export const deleteMediaFiles = async (serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = serverUrlParsedAsPath(serverUrl);
		const path = `${LOCAL_DOCUMENT_DIRECTORY}${serverUrlParsed}`;
		await FileSystem.deleteAsync(path, { idempotent: true });
	} catch (error) {
		log(error);
	}
};

const downloadQueue: { [index: string]: FileSystem.DownloadResumable } = {};

export const mediaDownloadKey = (messageUrl: string) => `${sanitizeString(messageUrl)}`;

export function isDownloadActive(messageUrl: string): boolean {
	return !!downloadQueue[mediaDownloadKey(messageUrl)];
}

export async function cancelDownload(messageUrl: string): Promise<void> {
	const downloadKey = mediaDownloadKey(messageUrl);
	if (!isEmpty(downloadQueue[downloadKey])) {
		try {
			await downloadQueue[downloadKey].cancelAsync();
		} catch {
			// Do nothing
		}
		delete downloadQueue[downloadKey];
	}
}

export function downloadMediaFile({
	type,
	mimeType,
	downloadUrl
}: {
	type: MediaTypes;
	mimeType?: string;
	downloadUrl: string;
}): Promise<string> {
	return new Promise(async (resolve, reject) => {
		let downloadKey = '';
		try {
			const path = getFilePath({ type, mimeType, urlToCache: downloadUrl });
			if (!path) {
				reject();
				return;
			}
			downloadKey = mediaDownloadKey(downloadUrl);
			downloadQueue[downloadKey] = FileSystem.createDownloadResumable(downloadUrl, path);
			const result = await downloadQueue[downloadKey].downloadAsync();
			if (result?.uri) {
				return resolve(result.uri);
			}
			reject();
		} catch {
			reject();
		} finally {
			delete downloadQueue[downloadKey];
		}
	});
}
