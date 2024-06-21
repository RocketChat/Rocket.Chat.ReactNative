import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { Alert } from 'react-native';

import { IUser, TSendFileMessageFileInfo, TUploadModel } from '../../../definitions';
import i18n from '../../../i18n';
import database from '../../database';
import FileUpload from '../helpers/fileUpload';
import log from '../helpers/log';
import { copyFileToCacheDirectoryIfNeeded, getUploadPath, persistUploadError, uploadQueue } from './utils';
import { IFormData } from '../helpers/fileUpload/definitions';

export async function sendFileMessage(
	rid: string,
	fileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> {
	let uploadPath: string | null = '';
	try {
		const { id, token } = user;
		const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;
		fileInfo.rid = rid;

		const db = database.active;
		const uploadsCollection = db.get('uploads');
		uploadPath = getUploadPath(fileInfo.path, rid);
		let uploadRecord: TUploadModel;
		try {
			uploadRecord = await uploadsCollection.find(uploadPath);
			if (uploadRecord.id && !isForceTryAgain) {
				return Alert.alert(i18n.t('FileUpload_Error'), i18n.t('Upload_in_progress'));
			}
		} catch (error) {
			try {
				await db.write(async () => {
					uploadRecord = await uploadsCollection.create(u => {
						u._raw = sanitizedRaw({ id: uploadPath }, uploadsCollection.schema);
						Object.assign(u, fileInfo);
						if (tmid) {
							u.tmid = tmid;
						}
						if (u.subscription) {
							u.subscription.id = rid;
						}
					});
				});
			} catch (e) {
				return log(e);
			}
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
