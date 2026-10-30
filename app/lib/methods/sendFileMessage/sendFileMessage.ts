import { type IUser, type TSendFileMessageFileInfo } from '~/definitions';
import { copyFileToCacheDirectoryIfNeeded } from './utils';
import { uploadFileMessage } from './uploadFileMessage';
import { type IFormData } from '../helpers/fileUpload/definitions';
import { getUploadHeaders } from '../helpers/getUploadHeaders';

export async function sendFileMessage(
	rid: string,
	fileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>
): Promise<void> {
	fileInfo.rid = rid;

	await uploadFileMessage({
		rid,
		fileInfo,
		tmid,
		prepare: async () => {
			const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;

			fileInfo.path = await copyFileToCacheDirectoryIfNeeded(fileInfo.path, fileInfo.name);

			const formData: IFormData[] = [];
			formData.push({
				name: 'file',
				type: fileInfo.type,
				filename: fileInfo.name || 'fileMessage',
				uri: fileInfo.path
			});

			if (fileInfo.description) {
				formData.push({
					name: 'description',
					data: fileInfo.description
				});
			}

			if (fileInfo.msg) {
				formData.push({
					name: 'msg',
					data: fileInfo.msg
				});
			}

			if (tmid) {
				formData.push({
					name: 'tmid',
					data: tmid
				});
			}

			return { url: uploadUrl, headers: getUploadHeaders(user), formData };
		}
	});
}
