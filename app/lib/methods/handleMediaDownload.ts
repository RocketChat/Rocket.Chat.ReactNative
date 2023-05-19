import * as FileSystem from 'expo-file-system';
import * as mime from 'react-native-mime-types';
import { isEmpty } from 'lodash';
import RNFetchBlob, { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob';

import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';

export enum MediaTypes {
	audio = 'audio',
	image = 'image',
	video = 'video'
}
const typeString = {
	[MediaTypes.audio]: 'audios/',
	[MediaTypes.image]: 'images/',
	[MediaTypes.video]: 'videos/'
};

const defaultType = {
	[MediaTypes.audio]: 'mp3',
	[MediaTypes.image]: 'jpg',
	[MediaTypes.video]: 'mp4'
};

const downloadQueue: { [index: string]: StatefulPromise<FetchBlobResponse> } = {};

export const mediaDownloadKey = (mediaType: MediaTypes, messageId: string) => `${mediaType}-${messageId}`;

export function isDownloadActive(mediaType: MediaTypes, messageId: string): boolean {
	return !!downloadQueue[mediaDownloadKey(mediaType, messageId)];
}

export async function cancelDownload(mediaType: MediaTypes, messageId: string): Promise<void> {
	const downloadKey = mediaDownloadKey(mediaType, messageId);
	if (!isEmpty(downloadQueue[downloadKey])) {
		console.log('🚀 ~ file: handleMediaDownload.ts:38 ~ cancelDownload ~ downloadQueue:', downloadQueue);
		try {
			await downloadQueue[downloadKey].cancel();
		} catch {
			// Do nothing
		}
		delete downloadQueue[downloadKey];
		console.log('🚀 ~ file: handleMediaDownload.ts:47 ~ cancelDownload ~ downloadQueue:', downloadQueue);
	}
}

export function downloadMediaFile({
	mediaType,
	messageId,
	downloadUrl,
	path
}: {
	mediaType: MediaTypes;
	messageId: string;
	downloadUrl: string;
	path: string;
}): Promise<string> {
	return new Promise((resolve, reject) => {
		const downloadKey = mediaDownloadKey(mediaType, messageId);
		const options = {
			timeout: 10000,
			indicator: true,
			overwrite: true,
			path: path.replace('file://', '')
		};
		downloadQueue[downloadKey] = RNFetchBlob.config(options).fetch('GET', downloadUrl);
		downloadQueue[downloadKey].then(response => {
			if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
				// If response is all good...
				try {
					resolve(path);
				} catch (e) {
					reject();
					log(e);
				} finally {
					delete downloadQueue[downloadKey];
				}
			} else {
				delete downloadQueue[downloadKey];
				reject();
			}
		});
		downloadQueue[downloadKey].catch(() => {
			delete downloadQueue[downloadKey];
			reject();
		});
	});
}

export const LOCAL_DOCUMENT_PATH = `${FileSystem.documentDirectory}`;

const sanitizeString = (value: string) => sanitizeLikeString(value.substring(value.lastIndexOf('/') + 1));

const getExtension = (type: MediaTypes, mimeType?: string) => {
	if (!mimeType) {
		return defaultType[type];
	}
	const extensionFromMime = () => {
		// The library is returning mpag instead of mp3 for audio/mpeg
		if (mimeType === 'audio/mpeg') {
			return 'mp3';
		}
		const extension = mime.extension(mimeType);
		// The mime.extension can return false when there aren't any extension
		if (!extension) {
			return defaultType[type];
		}
		return extension;
	};
	return extensionFromMime();
};

const ensureDirAsync = async (dir: string, intermediates = true): Promise<void> => {
	const info = await FileSystem.getInfoAsync(dir);
	if (info.exists && info.isDirectory) {
		return;
	}
	await FileSystem.makeDirectoryAsync(dir, { intermediates });
	return ensureDirAsync(dir, intermediates);
};

export const searchMediaFileAsync = async ({
	type,
	mimeType,
	messageId
}: {
	type: MediaTypes;
	mimeType?: string;
	messageId: string;
}) => {
	let file;
	let filePath = '';

	try {
		const serverUrl = store.getState().server.server;
		const serverUrlParsed = sanitizeString(serverUrl);
		const folderPath = `${LOCAL_DOCUMENT_PATH}${typeString[type]}${serverUrlParsed}`;
		const filename = `${messageId}.${getExtension(type, mimeType)}`;
		filePath = `${folderPath}/${filename}`;
		await ensureDirAsync(folderPath);
		file = await FileSystem.getInfoAsync(filePath);
	} catch (e) {
		log(e);
	}
	return { file, filePath };
};

export const deleteAllSpecificMediaFiles = async (type: MediaTypes, serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = sanitizeString(serverUrl);
		const path = `${LOCAL_DOCUMENT_PATH}${typeString[type]}${serverUrlParsed}`;
		await FileSystem.deleteAsync(path, { idempotent: true });
	} catch (error) {
		log(error);
	}
};
