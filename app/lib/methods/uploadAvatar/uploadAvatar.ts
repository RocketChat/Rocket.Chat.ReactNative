import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import FileUpload from '../helpers/fileUpload';
import { trackUpload } from '../helpers/fileUpload/uploadService';
import { type IFormData } from '../helpers/fileUpload/definitions';
import { copyFileToCacheDirectoryIfNeeded } from '../sendFileMessage/utils';
import { store as reduxStore } from '~/lib/store/auxStore';

export const uploadUserAvatarMultipart = async (localUri: string, mimeType: string, filename: string): Promise<void> => {
	const { server } = reduxStore.getState().server;
	const { id, token } = reduxStore.getState().login.user;
	let upload: FileUpload | undefined;
	const tracker = trackUpload(() => upload?.cancel());
	try {
		const filePath = await copyFileToCacheDirectoryIfNeeded(localUri, filename);
		const formData: IFormData[] = [{ name: 'image', uri: filePath, type: mimeType, filename }];
		const headers = {
			...RocketChatSettings.customHeaders,
			'Content-Type': 'multipart/form-data',
			'X-Auth-Token': token,
			'X-User-Id': id
		};
		upload = new FileUpload(`${server}/api/v1/users.setAvatar`, headers, formData, tracker.progress);
		await upload.send();
	} finally {
		tracker.end();
	}
};
