import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { type TSendFileMessageFileInfo, type IUser, type TUploadModel } from '~/definitions';
import database from '~/lib/database';
import { Encryption } from '~/lib/encryption';
import {
	copyFileToCacheDirectoryIfNeeded,
	createUploadProgressCallback,
	createUploadRecord,
	finalizeFailedUpload
} from './utils';
import { uploadWithRetry } from './uploadWithRetry';
import FileUpload from '../helpers/fileUpload';
import { type IFormData } from '../helpers/fileUpload/definitions';
import fetch from '../helpers/fetch';

export async function sendFileMessageV2(
	rid: string,
	fileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> {
	const uploadRecordPath = fileInfo.path;
	let uploadPath: string | null = '';
	let uploadRecord: TUploadModel | null;
	try {
		const { id, token } = user;
		const headers = {
			...RocketChatSettings.customHeaders,
			'Content-Type': 'multipart/form-data',
			'X-Auth-Token': token,
			'X-User-Id': id
		};
		const db = database.active;

		[uploadPath, uploadRecord] = await createUploadRecord({ rid, fileInfo, tmid, isForceTryAgain });
		if (!uploadPath || !uploadRecord) {
			throw new Error("Couldn't create upload record");
		}
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

		const response = await uploadWithRetry(
			uploadPath,
			() =>
				new FileUpload(`${server}/api/v1/rooms.media/${rid}`, headers, formData, createUploadProgressCallback(db, uploadRecord))
		);

		let content;
		if (getContent) {
			content = await getContent(response.file._id, response.file.url);
		}
		await fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${response.file._id}`, {
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
		await db.write(async () => {
			await uploadRecord?.destroyPermanently();
		});
	} catch (e: any) {
		console.error(e);
		await finalizeFailedUpload(uploadPath ?? '', uploadRecordPath, rid, e);
	}
}
