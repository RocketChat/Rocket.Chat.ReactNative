import FileUpload from '../helpers/fileUpload';
import { type IFormData } from '../helpers/fileUpload/definitions';
import { copyFileToCacheDirectoryIfNeeded } from '../sendFileMessage/utils';
import { store as reduxStore } from '../../store/auxStore';
import sdk from '../../services/sdk';

export const uploadUserAvatarMultipart = async (localUri: string, mimeType: string, filename: string): Promise<void> => {
	const { server } = reduxStore.getState().server;
	const { id, token } = reduxStore.getState().login.user;
	const filePath = await copyFileToCacheDirectoryIfNeeded(localUri, filename);
	const formData: IFormData[] = [{ name: 'image', uri: filePath, type: mimeType, filename }];
	const headers: Record<string, string> = {
		...sdk.getHeaders(),
		'Content-Type': 'multipart/form-data',
		...(token ? { 'X-Auth-Token': token } : {}),
		...(id ? { 'X-User-Id': id } : {})
	};
	const upload = new FileUpload(`${server}/api/v1/users.setAvatar`, headers, formData);
	await upload.send();
};
