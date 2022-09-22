import * as FileSystem from 'expo-file-system';

import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';

const parseServerUrl = (serverUrl: string) => sanitizeLikeString(serverUrl.substring(serverUrl.lastIndexOf('/') + 1));

const ensureDirAsync = async (dir: string, intermediates = true): Promise<void> => {
	const info = await FileSystem.getInfoAsync(dir);
	if (info.exists && info.isDirectory) {
		return;
	}
	await FileSystem.makeDirectoryAsync(dir, { intermediates });
	return ensureDirAsync(dir, intermediates);
};

export const downloadAudioFile = async (url: string, fileUrl: string): Promise<string> => {
	let path = '';
	try {
		const serverUrl = store.getState().server.server;
		const serverUrlParsed = parseServerUrl(serverUrl);
		const folderPath = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		const filePath = `${folderPath}/${fileUrl.substring(fileUrl.lastIndexOf('/') + 1)}`;
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
		const serverUrlParsed = parseServerUrl(serverUrl);
		const path = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		await FileSystem.deleteAsync(path);
	} catch (error) {
		log(error);
	}
};
