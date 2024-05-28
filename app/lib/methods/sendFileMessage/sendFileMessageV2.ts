import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import * as FileSystem from 'expo-file-system';

import { IUploadFile, IUser } from '../../../definitions';
import database from '../../database';
import { Encryption } from '../../encryption';
import { createUploadRecord, normalizeFilePath, persistUploadError, uploadQueue } from './utils';
import FileUpload, { IFileUpload } from '../helpers/fileUpload';

export async function sendFileMessageV2(
	rid: string,
	fileInfo: IUploadFile,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> {
	try {
		console.log('sendFileMessage', rid, fileInfo);
		const { id, token } = user;
		const headers = {
			...RocketChatSettings.customHeaders,
			'Content-Type': 'multipart/form-data',
			'X-Auth-Token': token,
			'X-User-Id': id
		};
		const db = database.active;

		const [uploadPath, uploadRecord] = await createUploadRecord({ rid, fileInfo, tmid, isForceTryAgain });
		if (!uploadPath || !uploadRecord) {
			throw new Error("Couldn't create upload record");
		}
		const { file, getContent } = await Encryption.encryptFile(rid, fileInfo);

		const formData: IFileUpload[] = [];
		formData.push({
			name: 'file',
			type: 'image/jpeg', // file.type,
			filename: file.name,
			uri: file.path
		});

		uploadQueue[uploadPath] = FileUpload.uploadFile(`${server}/api/v1/rooms.media/${rid}`, headers, formData);

		uploadQueue[uploadPath].uploadProgress(async (loaded: number, total: number) => {
			try {
				await db.write(async () => {
					await uploadRecord.update(u => {
						u.progress = Math.floor((loaded / total) * 100);
					});
				});
			} catch (e) {
				console.error(e);
			}
		});

		uploadQueue[uploadPath].then(async ({ respInfo }: { respInfo: XMLHttpRequest }) => {
			console.log('🚀 ~ uploadQueue[uploadPath].then ~ respInfo:', respInfo);
			// if (respInfo.status >= 200 && respInfo.status < 400) {
			// 	const json = JSON.parse(respInfo.responseText);
			// 	let content;
			// 	if (getContent) {
			// 		content = await getContent(json.file._id, json.file.url);
			// 	}
			// 	fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${json.file._id}`, {
			// 		method: 'POST',
			// 		headers: {
			// 			...headers,
			// 			'Content-Type': 'application/json'
			// 		},
			// 		body: JSON.stringify({
			// 			msg: file.msg || undefined,
			// 			tmid: tmid || undefined,
			// 			description: file.description || undefined,
			// 			t: content ? 'e2e' : undefined,
			// 			content
			// 		})
			// 	}).then(async () => {
			// 		await db.write(async () => {
			// 			await uploadRecord.destroyPermanently();
			// 		});
			// 	});
			// } else {
			// 	throw new Error('Failed to upload');
			// }
		});

		uploadQueue[uploadPath].catch(async e => {
			console.log('catch');
			await persistUploadError(fileInfo.path, rid);
			throw e;
		});
	} catch (e) {
		console.error(e);
		await persistUploadError(fileInfo.path, rid);
		throw e;
	}
}
