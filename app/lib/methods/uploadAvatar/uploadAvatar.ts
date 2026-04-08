import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import * as FileSystem from 'expo-file-system/legacy';

import FileUpload from '../helpers/fileUpload';
import { type IFormData } from '../helpers/fileUpload/definitions';
import { copyFileToCacheDirectoryIfNeeded } from '../sendFileMessage/utils';
import { store as reduxStore } from '../../store/auxStore';

export const uploadUserAvatarMultipart = async (localUri: string, mimeType: string, filename: string): Promise<void> => {
	const { server } = reduxStore.getState().server;
	const { id, token } = reduxStore.getState().login.user;
	const filePath = await copyFileToCacheDirectoryIfNeeded(localUri, filename);
	const formData: IFormData[] = [{ name: 'image', uri: filePath, type: mimeType, filename }];
	const headers = {
		...RocketChatSettings.customHeaders,
		'Content-Type': 'multipart/form-data',
		'X-Auth-Token': token,
		'X-User-Id': id
	};
	const upload = new FileUpload(`${server}/api/v1/users.setAvatar`, headers, formData);
	await upload.send();
};

export const uploadUserAvatarBase64 = async (data: string, contentType = ''): Promise<void> => {
	const ext = contentType?.includes('png') ? 'png' : 'jpeg';
	const cacheDir = FileSystem.cacheDirectory;
	if (!cacheDir) {
		throw new Error('No cache directory');
	}
	const cacheFile = `${cacheDir}avatar-suggestion-${Date.now()}.${ext}`;
	await FileSystem.writeAsStringAsync(cacheFile, data, { encoding: FileSystem.EncodingType.Base64 });
	await uploadUserAvatarMultipart(cacheFile, contentType || `image/${ext}`, `avatar.${ext}`);
};
