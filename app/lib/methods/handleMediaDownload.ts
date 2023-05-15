import * as FileSystem from 'expo-file-system';
import * as mime from 'react-native-mime-types';

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

const sanitizeString = (value: string) => sanitizeLikeString(value.substring(value.lastIndexOf('/') + 1));

const getExtension = (type: MediaTypes, mimeType?: string) => {
	if (!mimeType) {
		return defaultType[type];
	}
	// The library is returning mpag instead of mp3 for audio/mpeg
	const extensionFromMime = mimeType === 'audio/mpeg' ? 'mp3' : mime.extension(mimeType);
	return extensionFromMime;
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
		const folderPath = `${FileSystem.documentDirectory}${typeString[type]}${serverUrlParsed}`;
		const filename = `${messageId}.${getExtension(type, mimeType)}`;
		filePath = `${folderPath}/${filename}`;
		await ensureDirAsync(folderPath);
		file = await FileSystem.getInfoAsync(filePath);
	} catch (e) {
		log(e);
	}
	return { file, filePath };
};

export const downloadMediaFile = async (url: string, filePath: string, downloadResumable?: FileSystem.DownloadResumable) => {
	let uri = '';
	try {
		if (downloadResumable) {
			const downloadFile = await downloadResumable.downloadAsync();
			uri = downloadFile?.uri || '';
		} else {
			const downloadedFile = await FileSystem.downloadAsync(url, filePath);
			uri = downloadedFile.uri;
		}
	} catch (error) {
		log(error);
	}
	return uri;
};

export const deleteAllSpecificMediaFiles = async (type: MediaTypes, serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = sanitizeString(serverUrl);
		const path = `${FileSystem.documentDirectory}${typeString[type]}${serverUrlParsed}`;
		await FileSystem.deleteAsync(path, { idempotent: true });
	} catch (error) {
		log(error);
	}
};
