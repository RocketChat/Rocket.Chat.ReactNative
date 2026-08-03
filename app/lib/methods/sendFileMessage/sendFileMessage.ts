import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { type IUser, type TSendFileMessageFileInfo, type TUploadModel } from '../../../definitions';
import database from '../../database';
import FileUpload from '../helpers/fileUpload';
import { copyFileToCacheDirectoryIfNeeded, createUploadRecord, persistUploadError, uploadQueue } from './utils';
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
	try {
		const { id, token } = user;
		const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;
		fileInfo.rid = rid;

		const db = database.active;

		[uploadPath, uploadRecord] = await createUploadRecord({ rid, fileInfo, tmid, isForceTryAgain });
		if (!uploadPath || !uploadRecord) {
			return;
		}

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

		const headers = {
			...RocketChatSettings.customHeaders,
			'Content-Type': 'multipart/form-data',
			'X-Auth-Token': token,
			'X-User-Id': id
		};

		uploadQueue[uploadPath] = new FileUpload(uploadUrl, headers, formData, async (loaded, total) => {
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
		await uploadQueue[uploadPath].send();
		await db.write(async () => {
			await uploadRecord?.destroyPermanently();
		});
	} catch (e) {
		if (uploadPath && !uploadQueue[uploadPath]) {
			console.log('Upload cancelled');
		} else {
			await persistUploadError(fileInfo.path, rid);
			throw e;
		}
	}
}
