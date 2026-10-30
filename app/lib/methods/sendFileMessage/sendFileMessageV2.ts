import { type TSendFileMessageFileInfo, type IUser } from '~/definitions';
import { Encryption } from '~/lib/encryption';
import { copyFileToCacheDirectoryIfNeeded } from './utils';
import { uploadFileMessage } from './uploadFileMessage';
import { type IFormData } from '../helpers/fileUpload/definitions';
import { getUploadHeaders } from '../helpers/getUploadHeaders';
import { UploadHttpError } from '../helpers/fileUpload/UploadHttpError';
import { parseServerMessage } from '../helpers/parseUploadResponse';
import fetch from '../helpers/fetch';

export async function sendFileMessageV2(
	rid: string,
	fileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>
): Promise<void> {
	await uploadFileMessage({
		rid,
		fileInfo,
		tmid,
		prepare: async () => {
			const headers = getUploadHeaders(user);

			const { file, getContent, fileContent } = await Encryption.encryptFile(rid, fileInfo);
			file.path = await copyFileToCacheDirectoryIfNeeded(file.path, file.name);

			const formData: IFormData[] = [];
			formData.push({
				name: 'file',
				type: file.type,
				filename: file.name,
				uri: file.path
			});
			if (fileContent) {
				formData.push({
					name: 'content',
					data: JSON.stringify(fileContent)
				});
			}

			return {
				url: `${server}/api/v1/rooms.media/${rid}`,
				headers,
				formData,
				afterUpload: async response => {
					let content;
					if (getContent) {
						content = await getContent(response.file._id, response.file.url);
					}
					const confirmResponse = await fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${response.file._id}`, {
						method: 'POST',
						headers: {
							...headers,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							msg: (content ? '' : file.msg) || undefined,
							tmid: tmid || undefined,
							description: file.description || undefined,
							t: content ? 'e2e' : undefined,
							content
						})
					});
					if (!confirmResponse.ok) {
						throw new UploadHttpError(confirmResponse.status, {
							serverMessage: parseServerMessage(await confirmResponse.text())
						});
					}
				}
			};
		}
	});
}
