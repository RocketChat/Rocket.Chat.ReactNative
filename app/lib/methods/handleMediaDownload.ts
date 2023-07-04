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

const getExtension = (type: MediaTypes, mimeType?: string) => {
	if (!mimeType) {
		return defaultType[type];
	}
	// The library is returning mpag instead of mp3 for audio/mpeg
	if (mimeType === 'audio/mpeg') {
		return 'mp3';
	}
	// For older audios the server is returning the type audio/aac and we can't play it as mp3
	if (mimeType === 'audio/aac') {
		return 'm4a';
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
	const folderPath = getFolderPath();
	const fileUrlSanitized = sanitizeString(urlToCache);
	const filename = `${fileUrlSanitized}.${getExtension(type, mimeType)}`;
	const filePath = `${folderPath}${filename}`;
	return filePath;
};

const getFolderPath = () => {
	const serverUrl = store.getState().server.server;
	const serverUrlParsed = serverUrlParsedAsPath(serverUrl);
	const folderPath = `${LOCAL_DOCUMENT_DIRECTORY}${serverUrlParsed}`;
	return folderPath;
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
		const folderPath = getFolderPath();
		const filePath = getFilePath({ type, mimeType, urlToCache });
		if (!filePath) {
			return null;
		}
		await ensureDirAsync(folderPath);
		const file = await FileSystem.getInfoAsync(filePath);
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
		try {
			const path = getFilePath({ type, mimeType, urlToCache: downloadUrl });
			if (!path) {
				reject();
				return;
			}
			const downloadKey = mediaDownloadKey(downloadUrl);
			downloadQueue[downloadKey] = FileSystem.createDownloadResumable(downloadUrl, path);
			const result = await downloadQueue[downloadKey].downloadAsync();
			if (result?.uri) {
				return resolve(result.uri);
			}
			reject();
		} catch {
			reject();
		}
	});
}
