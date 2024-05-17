import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import isEmpty from 'lodash/isEmpty';
import RNFetchBlob, { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob';
import { Alert } from 'react-native';
import { sha256 } from 'js-sha256';

import { Encryption } from '../encryption';
import { IUpload, IUser, TUploadModel } from '../../definitions';
import i18n from '../../i18n';
import database from '../database';
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

const createUploadRecord = async ({
	rid,
	fileInfo,
	tmid,
	isForceTryAgain
}: {
	rid: string;
	fileInfo: IUpload;
	tmid: string | undefined;
	isForceTryAgain?: boolean;
}) => {
	const db = database.active;
	const uploadsCollection = db.get('uploads');
	const uploadPath = getUploadPath(fileInfo.path, rid);
	let uploadRecord: TUploadModel | null = null;
	try {
		uploadRecord = await uploadsCollection.find(uploadPath);
		if (uploadRecord.id && !isForceTryAgain) {
			Alert.alert(i18n.t('FileUpload_Error'), i18n.t('Upload_in_progress'));
			return [null, null];
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
			throw e;
		}
	}
	return [uploadPath, uploadRecord] as const;
};

export function sendFileMessage(
	rid: string,
	fileInfo: IUpload,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<FetchBlobResponse | void> {
	return new Promise(async (resolve, reject) => {
		try {
			const { id, token } = user;
			fileInfo.rid = rid;
			fileInfo.path = fileInfo.path.startsWith('file://') ? fileInfo.path.substring(7) : fileInfo.path;
			const [uploadPath, uploadRecord] = await createUploadRecord({ rid, fileInfo, tmid, isForceTryAgain });
			if (!uploadPath || !uploadRecord) {
				return;
			}
			const encryptedFileInfo = await Encryption.encryptFile(rid, fileInfo);
			const { encryptedFile, getContent } = encryptedFileInfo;

			const headers = {
				...RocketChatSettings.customHeaders,
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': token,
				'X-User-Id': id
			};

			const db = database.active;
			const data = [
				{
					name: 'file',
					type: 'file',
					filename: sha256(fileInfo.name || 'fileMessage'),
					data: RNFetchBlob.wrap(decodeURI(encryptedFile))
				}
			];

			uploadQueue[uploadPath] = RNFetchBlob.fetch('POST', `${server}/api/v1/rooms.media/${rid}`, headers, data);

			uploadQueue[uploadPath].then(async response => {
				// If response is all good...
				if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
					try {
						const json = response.json();
						let content;
						if (getContent) {
							content = await getContent(json.file._id, json.file.url);
						}
						await fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${json.file._id}`, {
							method: 'POST',
							headers: {
								...headers,
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								// msg: '', TODO: backwards compatibility
								tmid,
								description: fileInfo.description,
								t: 'e2e',
								content
							})
						});

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
		} catch (e) {
			log(e);
		}
	});
}
