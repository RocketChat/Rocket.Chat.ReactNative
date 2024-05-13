import * as FileSystem from 'expo-file-system';
import * as mime from 'react-native-mime-types';
import { isEmpty } from 'lodash';
// import { Base64 } from 'js-base64';

import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';
import { Base64, b64ToBuffer, b64URIToBuffer, base64Decode, decryptAESCTR } from '../encryption/utils';

export type MediaTypes = 'audio' | 'image' | 'video';

export type TDownloadState = 'to-download' | 'loading' | 'downloaded';

const defaultType = {
	audio: 'mp3',
	image: 'jpg',
	video: 'mp4'
};

export const LOCAL_DOCUMENT_DIRECTORY = FileSystem.documentDirectory;

const serverUrlParsedAsPath = (serverURL: string) => `${sanitizeLikeString(serverURL)}/`;

const sanitizeFileName = (value: string) => {
	const extension = value.substring(value.lastIndexOf('.') + 1);
	const toSanitize = value.substring(0, value.lastIndexOf('.'));
	return `${sanitizeLikeString(toSanitize)}.${extension}`;
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
	const extension = getExtension(type, mimeType, url);
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

const getExtension = (type: MediaTypes, mimeType?: string, url?: string) => {
	// support url with gif extension and mimetype undefined, ex.: using the app tenor and giphy.
	if (url?.split('.').pop() === 'gif') {
		return 'gif';
	}
	if (!mimeType) {
		return defaultType[type];
	}
	// support audio from older versions
	if (url?.split('.').pop() === 'm4a') {
		return 'm4a';
	}
	// The library is returning mpag instead of mp3 for audio/mpeg
	if (mimeType === 'audio/mpeg') {
		return 'mp3';
	}
	if (mimeType === 'audio/aac') {
		return 'aac';
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

export const getFilePath = ({
	type,
	mimeType,
	urlToCache,
	encrypted = false
}: {
	type: MediaTypes;
	mimeType?: string;
	urlToCache?: string;
	encrypted?: boolean;
}): string | null => {
	if (!urlToCache) {
		return null;
	}
	const folderPath = getFolderPath(urlToCache);
	const urlWithoutQueryString = urlToCache.split('?')[0];
	const filename = sanitizeFileName(getFilename({ type, mimeType, url: urlWithoutQueryString }));
	const filePath = `${folderPath}${filename}${encrypted ? '.enc' : ''}`;
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

export const mediaDownloadKey = (messageUrl: string) => `${sanitizeLikeString(messageUrl)}`;

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
	downloadUrl,
	encryption
}: {
	type: MediaTypes;
	mimeType?: string;
	downloadUrl: string;
	encryption: any;
}): Promise<string> {
	return new Promise(async (resolve, reject) => {
		let downloadKey = '';
		try {
			const path = getFilePath({ type, mimeType, urlToCache: downloadUrl, encrypted: !!encryption });
			console.log('🚀 ~ returnnewPromise ~ path:', path);
			if (!path) {
				return reject();
			}
			downloadKey = mediaDownloadKey(downloadUrl);
			downloadQueue[downloadKey] = FileSystem.createDownloadResumable(downloadUrl, path);
			const result = await downloadQueue[downloadKey].downloadAsync();

			console.log('🚀 ~ returnnewPromise ~ result:', result);

			// const decryptedFile = await Encryption.decryptFile(rid, result.uri.substring(7), encryption.key, encryption.iv);
			// console.log('🚀 ~ downloadMediaFile ~ decryptedFile:', decryptedFile);

			console.log('🚀 ~ returnnewPromise ~ encryption:', encryption);
			const exportedKeyArrayBuffer = b64URIToBuffer(encryption.key.k);
			// const vector = b64URIToBuffer(encryption.iv);
			// const vector = b64ToBuffer(encryption.iv);
			// const vector = Base64.decode(encryption.iv);
			// const vector = Base64.decode(encryption.iv);
			const vector = base64Decode(encryption.iv);
			console.log('🚀 ~ returnnewPromise ~ vector:', vector);

			const decryptedFile = await decryptAESCTR(result.uri.substring(7), exportedKeyArrayBuffer, vector);
			console.log('🚀 ~ handleMediaDownload ~ decryptedFile:', decryptedFile);

			if (result?.uri) {
				return resolve(result.uri);
			}
			return reject();
		} catch (e) {
			console.error(e);
			return reject();
		} finally {
			delete downloadQueue[downloadKey];
		}
	});
}

export function resumeMediaFile({ downloadUrl }: { downloadUrl: string }): Promise<string> {
	return new Promise(async (resolve, reject) => {
		let downloadKey = '';
		try {
			downloadKey = mediaDownloadKey(downloadUrl);
			const result = await downloadQueue[downloadKey].resumeAsync();
			if (result?.uri) {
				return resolve(result.uri);
			}
			return reject();
		} catch {
			return reject();
		} finally {
			delete downloadQueue[downloadKey];
		}
	});
}
