import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { type IUser } from '~/definitions/IUser';
import { type TSendFileMessageFileInfo, type TUploadModel } from '~/definitions/IUpload';
import database from '~/lib/database';
import FileUpload from '../helpers/fileUpload';
import {
	copyFileToCacheDirectoryIfNeeded,
	createUploadRecord,
	endUpload,
	isUploadCancelled,
	persistUploadError,
	uploadQueue
} from './utils';
import { type IFormData } from '../helpers/fileUpload/definitions';

export async function sendFileMessage(
	rid: string,
	fileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> {
	let uploadPath: string | null = '';
	let uploadRecord: TUploadModel | null;
	let upload: FileUpload | undefined;
	try {
		const { id, token } = user;
		const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;
		fileInfo.rid = rid;

		const db = database.active;

		[uploadPath, uploadRecord] = await createUploadRecord({ rid, fileInfo, tmid, isForceTryAgain });
		if (!uploadPath || !uploadRecord) {
			return;
		}

		const fileUri = await copyFileToCacheDirectoryIfNeeded(fileInfo.path, fileInfo.name);

		const formData: IFormData[] = [];
		formData.push({
			name: 'file',
			type: fileInfo.type,
			filename: fileInfo.name || 'fileMessage',
			uri: fileUri
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

		const headers = {
			...RocketChatSettings.customHeaders,
			'Content-Type': 'multipart/form-data',
			'X-Auth-Token': token,
			'X-User-Id': id
		};

		upload = new FileUpload(uploadUrl, headers, formData, async (loaded, total) => {
			try {
				await db.write(async () => {
					await uploadRecord?.update(u => {
						u.progress = Math.floor((loaded / total) * 100);
					});
				});
			} catch (e) {
				console.error(e);
			}
		});
		uploadQueue[uploadPath] = upload;
		await upload.send();
		await db.write(async () => {
			await uploadRecord?.destroyPermanently();
		});
	} catch (e) {
		if (upload && isUploadCancelled(uploadPath, upload)) {
			console.log('Upload cancelled');
		} else {
			await persistUploadError(fileInfo.path, rid);
			throw e;
		}
	} finally {
		if (upload) {
			endUpload(uploadPath, upload);
		}
	}
}
