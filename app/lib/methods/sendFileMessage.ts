import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob';
import isEmpty from 'lodash/isEmpty';

import FileUpload from '../../utils/fileUpload';
import database from '../database';
import log from '../../utils/log';
import { IUpload, IUser, TUploadModel } from '../../definitions';
import { IFileUpload } from '../../utils/fileUpload/interfaces';

const uploadQueue: { [index: string]: StatefulPromise<FetchBlobResponse> } = {};

export function isUploadActive(path: string): boolean {
	return !!uploadQueue[path];
}

export async function cancelUpload(item: TUploadModel): Promise<void> {
	if (!isEmpty(uploadQueue[item.path])) {
		try {
			await uploadQueue[item.path].cancel();
		} catch {
			// Do nothing
		}
		try {
			const db = database.active;
			await db.write(async () => {
				await item.destroyPermanently();
			});
		} catch (e) {
			log(e);
		}
		delete uploadQueue[item.path];
	}
}

export function sendFileMessage(
	rid: string,
	fileInfo: IUpload,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>
): Promise<FetchBlobResponse | void> {
	return new Promise(async (resolve, reject) => {
		try {
			const { id, token } = user;

			const uploadUrl = `${server}/api/v1/rooms.upload/${rid}`;

			fileInfo.rid = rid;

			const db = database.active;
			const uploadsCollection = db.get('uploads');
			let uploadRecord: TUploadModel;
			try {
				uploadRecord = await uploadsCollection.find(fileInfo.path);
			} catch (error) {
				try {
					await db.write(async () => {
						uploadRecord = await uploadsCollection.create(u => {
							u._raw = sanitizedRaw({ id: fileInfo.path }, uploadsCollection.schema);
							Object.assign(u, fileInfo);
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

			uploadQueue[fileInfo.path] = FileUpload.fetch('POST', uploadUrl, headers, formData);

			uploadQueue[fileInfo.path].uploadProgress(async (loaded: number, total: number) => {
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

			uploadQueue[fileInfo.path].then(async response => {
				if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
					// If response is all good...
					try {
						await db.write(async () => {
							await uploadRecord.destroyPermanently();
						});
						resolve(response);
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

			uploadQueue[fileInfo.path].catch(async error => {
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
