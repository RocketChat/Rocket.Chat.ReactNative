import * as FileSystem from 'expo-file-system';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

import { sanitizeLikeString } from '../database/utils';
import { store } from '../store/auxStore';
import log from './helpers/log';

const sanitizeString = (value: string) => sanitizeLikeString(value.substring(value.lastIndexOf('/') + 1));

const parseFilename = (value: string) => {
	const extension = value.substring(value.lastIndexOf('.') + 1);
	const filename = sanitizeString(value.substring(value.lastIndexOf('/') + 1).split('.')[0]);
	return `${filename}.${extension}`;
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
		const filename = `${messageId}_${parseFilename(fileUrl)}`;
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

export const encodeAudio = (fileURI: string): Promise<string> =>
	new Promise((resolve, reject) => {
		const fileName = sanitizeString(fileURI.substring(fileURI.lastIndexOf('/') + 1).split('.')[0]);
		const newFilePath = `${FileSystem.cacheDirectory}${fileName}.mp3`;
		const ffmpegCommand = `-hide_banner -y -i ${fileURI} -c:a libmp3lame -qscale:a 2 ${newFilePath}`;
		FFmpegKit.execute(ffmpegCommand).then(async session => {
			const returnCode = await session.getReturnCode();
			if (ReturnCode.isSuccess(returnCode)) {
				return resolve(newFilePath);
			}
			if (ReturnCode.isCancel(returnCode)) {
				return reject();
			}
		});
	});
