import * as FileSystem from 'expo-file-system';
import { PermissionsAndroid } from 'react-native';

import i18n from '../../i18n';
import { store } from '../store/auxStore';
import { isAndroid } from './helpers';
import log from './helpers/log';

// It should be necessary, but in my tests, even uninstalling it didn't ask for permission.
// Maybe it could be the android version?
// Call when entering room view.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const askForPermissionToSaveFiles = async () => {
	if (isAndroid) {
		const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
			title: i18n.t('Write_External_Permission'),
			message: i18n.t('Write_External_Permission'),
			buttonPositive: 'Ok'
		});
		if (result !== PermissionsAndroid.RESULTS.GRANTED) {
			return Promise.reject();
		}
	}
	return Promise.resolve();
};

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
		const serverUrlParsed = serverUrl.substring(serverUrl.lastIndexOf('/') + 1);
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
		const serverUrlParsed = serverUrl.substring(serverUrl.lastIndexOf('/') + 1);
		const path = `${FileSystem.documentDirectory}audios/${serverUrlParsed}`;
		await FileSystem.deleteAsync(path);
	} catch (error) {
		log(error);
	}
};
