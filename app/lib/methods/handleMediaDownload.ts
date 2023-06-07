import * as FileSystem from 'expo-file-system';
import * as mime from 'react-native-mime-types';
import { isEmpty } from 'lodash';

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

const downloadQueue: { [index: string]: FileSystem.DownloadResumable } = {};

export const mediaDownloadKey = (mediaType: MediaTypes, messageId: string) => `${mediaType}-${messageId}`;

export function isDownloadActive(mediaType: MediaTypes, messageId: string): boolean {
	return !!downloadQueue[mediaDownloadKey(mediaType, messageId)];
}

export async function cancelDownload(mediaType: MediaTypes, messageId: string): Promise<void> {
	const downloadKey = mediaDownloadKey(mediaType, messageId);
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
	return new Promise(async (resolve, reject) => {
		try {
			const downloadKey = mediaDownloadKey(mediaType, messageId);
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

export const LOCAL_DOCUMENT_PATH = `${FileSystem.documentDirectory}`;

const sanitizeString = (value: string) => sanitizeLikeString(value.substring(value.lastIndexOf('/') + 1));

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

export const deleteMediaFiles = async (type: MediaTypes, serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = sanitizeString(serverUrl);
		const path = `${LOCAL_DOCUMENT_PATH}${typeString[type]}${serverUrlParsed}`;
		await FileSystem.deleteAsync(path, { idempotent: true });
	} catch (error) {
		log(error);
	}
};
