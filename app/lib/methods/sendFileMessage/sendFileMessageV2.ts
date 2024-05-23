import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import RNFetchBlob, { FetchBlobResponse } from 'rn-fetch-blob';

import { IUploadFile, IUser } from '../../../definitions';
import database from '../../database';
import { Encryption } from '../../encryption';
import { createUploadRecord, normalizeFilePath, persistUploadError, uploadQueue } from './utils';

export async function sendFileMessageV2(
	rid: string,
	fileInfo: IUploadFile,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<FetchBlobResponse | void> {
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
		fileInfo.path = normalizeFilePath(fileInfo.path);

		const [uploadPath, uploadRecord] = await createUploadRecord({ rid, fileInfo, tmid, isForceTryAgain });
		if (!uploadPath || !uploadRecord) {
			throw new Error("Couldn't create upload record");
		}
		const { file, getContent } = await Encryption.encryptFile(rid, fileInfo);

		// @ts-ignore
		uploadQueue[uploadPath] = RNFetchBlob.fetch('POST', `${server}/api/v1/rooms.media/${rid}`, headers, [
			{
				name: 'file',
				type: file.type,
				filename: file.name,
				data: RNFetchBlob.wrap(decodeURI(normalizeFilePath(file.path)))
			}
		])
			.uploadProgress(async (loaded: number, total: number) => {
				await db.write(async () => {
					await uploadRecord.update(u => {
						u.progress = Math.floor((loaded / total) * 100);
					});
				});
			})
			.then(async response => {
				const json = response.json();
				let content;
				if (getContent) {
					content = await getContent(json.file._id, json.file.url);
				}
				fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${json.file._id}`, {
					method: 'POST',
					headers: {
						...headers,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						// msg: '', TODO: backwards compatibility
						tmid: tmid ?? undefined,
						description: file.description,
						t: content ? 'e2e' : undefined,
						content
					})
				}).then(async () => {
					await db.write(async () => {
						await uploadRecord.destroyPermanently();
					});
				});
			});
	} catch (e) {
		await persistUploadError(fileInfo.path, rid);
		throw e;
	}
}
