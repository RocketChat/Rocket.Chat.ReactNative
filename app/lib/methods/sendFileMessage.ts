import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import isEmpty from 'lodash/isEmpty';
import { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob';
import { Alert } from 'react-native';

import { IUpload, IUser, TUploadModel } from '../../definitions';
import i18n from '../../i18n';
import database from '../database';
import FileUpload from './helpers/fileUpload';
import { IFileUpload } from './helpers/fileUpload/interfaces';
import log from './helpers/log';

const uploadQueue: { [index: string]: StatefulPromise<FetchBlobResponse> } = {};

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
	chunkUploadEnabled?: boolean,
	chunkMaxSize?: number,
	isForceTryAgain?: boolean
): Promise<FetchBlobResponse | void> {
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

			const shouldChunk: boolean = chunkUploadEnabled === true && chunkMaxSize !== undefined && fileInfo.size > chunkMaxSize;

			const headers = {
				...RocketChatSettings.customHeaders,
				'X-Auth-Token': token,
				'X-User-Id': id
			};

			let chunkSeekOffset = fileInfo.chunkState ? fileInfo.chunkState.offset : 0;
			let chunkEndOffset = 0;

			const iterUpload = function () {
				const formData: IFileUpload[] = [];

				headers['Content-Type'] = shouldChunk ? 'application/octet-stream' : 'multipart/form-data';

				if (shouldChunk) {
					// @ts-ignore
					const nextEndOffset = chunkSeekOffset + chunkMaxSize;
					chunkEndOffset = nextEndOffset > fileInfo.size ? fileInfo.size : nextEndOffset;

					headers['Content-Range'] = `bytes ${chunkSeekOffset}-${chunkEndOffset}/${fileInfo.size}`;
				}

				formData.push({
					name: 'file',
					type: fileInfo.type,
					filename: fileInfo.name || 'fileMessage',
					uri: fileInfo.path
				});

				if (shouldChunk) {
					formData[0].chunkStartOffset = chunkSeekOffset;
					formData[0].chunkEndOffset = chunkEndOffset;
				}

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

				uploadQueue[uploadPath] = FileUpload.fetch('POST', uploadUrl, headers, formData);

				if (shouldChunk) {
					uploadQueue[uploadPath].uploadProgress(async (loaded: number) => {
						try {
							await db.write(async () => {
								await uploadRecord.update(u => {
									u.progress = Math.floor((chunkEndOffset + loaded / fileInfo.size) * 100);
								});
							});
						} catch (e) {
							log(e);
						}
					});

					uploadQueue[uploadPath].then(async response => {
						if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
							const remainingSize = fileInfo.size - chunkEndOffset;

							if (remainingSize === 0) {
								try {
									await db.write(async () => {
										await uploadRecord.destroyPermanently();
									});
									resolve(response);
								} catch (e) {
									log(e);
								}
							}

							chunkSeekOffset = chunkEndOffset;
							iterUpload();
						} else {
							try {
								await db.write(async () => {
									await uploadRecord.update(u => {
										u.error = true;
										// @ts-ignore
										u.chunkState = { offset: chunkSeekOffset, blocSize: chunkMaxSize };
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
									// @ts-ignore
									u.chunkState = { offset: chunkSeekOffset, blocSize: chunkMaxSize };
								});
							});
						} catch (e) {
							log(e);
						}
						reject(error);
					});

					return;
				}

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
			};

			iterUpload();
		} catch (e) {
			log(e);
		}
	});
}
