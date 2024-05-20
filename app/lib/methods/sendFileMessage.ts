import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import isEmpty from 'lodash/isEmpty';
import { Alert } from 'react-native';

import { IUpload, IUser, TUploadModel } from '../../definitions';
import i18n from '../../i18n';
import database from '../database';
import type { IFileUpload, Upload } from './helpers/fileUpload';
import FileUpload from './helpers/fileUpload';
import log from './helpers/log';

const uploadQueue: { [index: string]: Upload } = {};

const getUploadPath = (path: string, rid: string) => `${path}-${rid}`;

export function isUploadActive(path: string, rid: string): boolean {
	return !!uploadQueue[getUploadPath(path, rid)];
}

export async function cancelUpload(item: TUploadModel, rid: string): Promise<void> {
	const uploadPath = getUploadPath(item.path, rid);
	if (!isEmpty(uploadQueue[uploadPath])) {
		try {
			await uploadQueue[uploadPath].cancel();
		} catch {
			// Do nothing
		}
		delete uploadQueue[uploadPath];
	}
	if (item.id) {
		try {
			const db = database.active;
			await db.write(async () => {
				await item.destroyPermanently();
			});
		} catch (e) {
			log(e);
		}
	}
}

export function sendFileMessage(
	rid: string,
	fileInfo: IUpload,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> {
	return new Promise(async (resolve, reject) => {
		try {
			const { id, token } = user;

			const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;

			fileInfo.rid = rid;

			const db = database.active;
			const uploadsCollection = db.get('uploads');
			const uploadPath = getUploadPath(fileInfo.path, rid);
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

			const formData: IFileUpload[] = [];
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

			uploadQueue[uploadPath] = FileUpload.uploadFile(uploadUrl, headers, formData);

			uploadQueue[uploadPath].uploadProgress(async (loaded: number, total: number) => {
				try {
					await db.write(async () => {
						await uploadRecord.update(u => {
							u.progress = Math.floor((loaded / total) * 100);
						});
					});
				} catch (e) {
					log(e);
				}
			});

			uploadQueue[uploadPath].then(async response => {
				if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
					try {
						await db.write(async () => {
							await uploadRecord.destroyPermanently();
						});
						resolve();
					} catch (e) {
						log(e);
					}
				} else {
					try {
						await db.write(async () => {
							await uploadRecord.update(u => {
								u.error = true;
							});
						});
					} catch (e) {
						log(e);
					}
					try {
						reject(response);
					} catch (e) {
						reject(e);
					}
				}
			});

			uploadQueue[uploadPath].catch(async error => {
				try {
					await db.write(async () => {
						await uploadRecord.update(u => {
							u.error = true;
						});
					});
				} catch (e) {
					log(e);
				}
				reject(error);
			});
		} catch (e) {
			log(e);
		}
	});
}
