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

export const searchAudioFileAsync = async (fileUrl: string, messageId: string) => {
	let file;
	let filePath = '';
	try {
		const serverUrl = store.getState().server.server;
		const serverUrlParsed = sanitizeString(serverUrl);
		const folderPath = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		const filename = `${messageId}.${getExtension(fileUrl)}`;
		filePath = `${folderPath}/${filename}`;
		await ensureDirAsync(folderPath);
		file = await FileSystem.getInfoAsync(filePath);
	} catch (e) {
		log(e);
	}
	return { file, filePath };
};

export const downloadAudioFile = async (url: string, filePath: string) => {
	let uri = '';
	try {
		const downloadedFile = await FileSystem.downloadAsync(url, filePath);
		uri = downloadedFile.uri;
	} catch (error) {
		log(error);
	}
	return uri;
};

export const deleteAllAudioFiles = async (serverUrl: string): Promise<void> => {
	try {
		const serverUrlParsed = sanitizeString(serverUrl);
		const path = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		await FileSystem.deleteAsync(path, { idempotent: true });
	} catch (error) {
		log(error);
	}
};
