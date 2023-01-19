import * as FileSystem from 'expo-file-system';

import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';

const DEFAULT_EXTENSION = 'mp3';

const sanitizeString = (value: string) => sanitizeLikeString(value.substring(value.lastIndexOf('/') + 1));

const getExtension = (value: string) => {
	let extension = DEFAULT_EXTENSION;
	const filename = value.split('/').pop();
	if (filename?.includes('.')) {
		extension = value.substring(value.lastIndexOf('.') + 1);
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

export const downloadAudioFile = async (url: string, fileUrl: string, messageId: string): Promise<string> => {
	let path = '';
	try {
		const serverUrl = store.getState().server.server;
		const serverUrlParsed = sanitizeString(serverUrl);
		const folderPath = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		const filename = `${messageId}.${getExtension(fileUrl)}`;
		const filePath = `${folderPath}/${filename}`;
		await ensureDirAsync(folderPath);
		const file = await FileSystem.getInfoAsync(filePath);
		if (!file.exists) {
			const downloadedFile = await FileSystem.downloadAsync(url, filePath);
			path = downloadedFile.uri;
		} else {
			path = file.uri;
		}
	} catch (error) {
		log(error);
	}
	return path;
};

export const deleteAllAudioFiles = async (serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = sanitizeString(serverUrl);
		const path = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		await FileSystem.deleteAsync(path);
	} catch (error) {
		log(error);
	}
};
