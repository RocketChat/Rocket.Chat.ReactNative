import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import isEmpty from 'lodash/isEmpty';
import RNFetchBlob, { FetchBlobResponse, StatefulPromise } from 'rn-fetch-blob';
import { Alert } from 'react-native';

import { Encryption } from '../encryption';
import { IUpload, IUser, TUploadModel } from '../../definitions';
import i18n from '../../i18n';
import database from '../database';
import FileUpload from './helpers/fileUpload';
import { IFileUpload } from './helpers/fileUpload/interfaces';
import log from './helpers/log';
import { E2E_MESSAGE_TYPE } from '../constants';
import { store } from '../store/auxStore';
import { compareServerVersion } from './helpers';

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
	isForceTryAgain?: boolean,
	getContent?: Function
): Promise<FetchBlobResponse | void> {
	return new Promise(async (resolve, reject) => {
		try {
			const { id, token } = user;

			const uploadUrl = `${server}/api/v1/rooms.media/${rid}`;

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

			// const encryptedFileInfo = await Encryption.encryptMessage(fileInfo);

			const formData: IFileUpload[] = [];
			formData.push({
				name: 'file',
				type: fileInfo.type,
				filename: fileInfo.name || 'fileMessage',
				uri: fileInfo.path
			});

			// if (fileInfo.description) {
			// 	formData.push({
			// 		name: 'description',
			// 		data: encryptedFileInfo.description
			// 	});
			// }

			// if (fileInfo.msg) {
			// 	formData.push({
			// 		name: 'msg',
			// 		data: fileInfo.msg
			// 	});
			// }

			// if (tmid) {
			// 	formData.push({
			// 		name: 'tmid',
			// 		data: tmid
			// 	});
			// }

			// const { version: serverVersion } = store.getState().server;
			// if (encryptedFileInfo.t === E2E_MESSAGE_TYPE && compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.8.0')) {
			// 	formData.push({
			// 		name: 't',
			// 		data: encryptedFileInfo.t
			// 	});
			// 	formData.push({
			// 		name: 'e2e',
			// 		data: encryptedFileInfo.e2e
			// 	});
			// }

			const headers = {
				...RocketChatSettings.customHeaders,
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': token,
				'X-User-Id': id
			};

			try {
				const data = formData.map(item => {
					if (item.uri) {
						return {
							name: item.name,
							type: item.type,
							filename: item.filename,
							data: RNFetchBlob.wrap(decodeURI(item.uri))
						};
					}
					return item;
				});
				console.log('🚀 ~ data ~ data:', data);
				const response = await RNFetchBlob.fetch('POST', uploadUrl, headers, data);
				console.log(response);

				const json = response.json();
				console.log('🚀 ~ returnnewPromise ~ json:', json);

				console.log('🚀 ~ returnnewPromise ~ getContent:', getContent);
				let content;
				if (getContent) {
					content = await getContent(json.file._id, json.file.url);
					console.log('🚀 ~ returnnewPromise ~ content:', content);
				}

				const mediaConfirm = await fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${json.file._id}`, {
					method: 'POST',
					headers,
					body: JSON.stringify({
						msg: fileInfo.msg,
						tmid: fileInfo.tmid,
						description: fileInfo.description,
						t: fileInfo.t,
						content
					})
				});
				console.log('🚀 ~ returnnewPromise ~ mediaConfirm :', mediaConfirm);
			} catch (e) {
				console.error(e);
			}

			// uploadQueue[uploadPath] = FileUpload.fetch('POST', uploadUrl, headers, formData);

			// uploadQueue[uploadPath].uploadProgress(async (loaded: number, total: number) => {
			// 	try {
			// 		await db.write(async () => {
			// 			await uploadRecord.update(u => {
			// 				u.progress = Math.floor((loaded / total) * 100);
			// 			});
			// 		});
			// 	} catch (e) {
			// 		log(e);
			// 	}
			// });

			// uploadQueue[uploadPath].then(async response => {
			// 	// If response is all good...
			// 	if (response.respInfo.status >= 200 && response.respInfo.status < 400) {
			// 		try {
			// 			console.log('🚀 ~ returnnewPromise ~ response:', response);
			// 			console.log('🚀 ~ returnnewPromise ~ response:', response.data);
			// 			// if (getContent) {
			// 			// 	const content = getContent(response.json().file._id, response.json().file.url);
			// 			// 	console.log('🚀 ~ returnnewPromise ~ content:', content);
			// 			// }

			// 			await db.write(async () => {
			// 				await uploadRecord.destroyPermanently();
			// 			});
			// 			resolve(response);
			// 		} catch (e) {
			// 			log(e);
			// 		}
			// 	} else {
			// 		try {
			// 			await db.write(async () => {
			// 				await uploadRecord.update(u => {
			// 					u.error = true;
			// 				});
			// 			});
			// 		} catch (e) {
			// 			log(e);
			// 		}
			// 		try {
			// 			reject(response);
			// 		} catch (e) {
			// 			reject(e);
			// 		}
			// 	}
			// });

			// uploadQueue[uploadPath].catch(async error => {
			// 	try {
			// 		await db.write(async () => {
			// 			await uploadRecord.update(u => {
			// 				u.error = true;
			// 			});
			// 		});
			// 	} catch (e) {
			// 		log(e);
			// 	}
			// 	reject(error);
			// });
		} catch (e) {
			log(e);
		}
	});
}
