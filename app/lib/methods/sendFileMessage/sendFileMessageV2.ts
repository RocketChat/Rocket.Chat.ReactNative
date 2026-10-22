import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { type TSendFileMessageFileInfo, type IUser, type TUploadModel } from '~/definitions';
import database from '~/lib/database';
import { Encryption } from '~/lib/encryption';
import { type TGetContentResult } from '~/lib/encryption/definitions';
import { cancelUpload, copyFileToCacheDirectoryIfNeeded, createUploadRecord, persistUploadError, uploadQueue } from './utils';
import FileUpload from '../helpers/fileUpload';
import { type IFormData } from '../helpers/fileUpload/definitions';
import { trackUpload } from '../helpers/fileUpload/uploadService';
import fetch from '../helpers/fetch';

const getMediaConfirmBody = ({
	file,
	tmid,
	content
}: {
	file: Pick<TSendFileMessageFileInfo, 'msg' | 'description'>;
	tmid: string | undefined;
	content: TGetContentResult | undefined;
}) =>
	JSON.stringify({
		msg: (content ? '' : file.msg) || undefined,
		tmid: tmid || undefined,
		description: file.description || undefined,
		t: content ? 'e2e' : undefined,
		content
	});

export async function sendFileMessageV2(
	rid: string,
	fileInfo: TSendFileMessageFileInfo,
	tmid: string | undefined,
	server: string,
	user: Partial<Pick<IUser, 'id' | 'token'>>,
	isForceTryAgain?: boolean
): Promise<void> {
	let uploadPath: string | null = '';
	let uploadRecord: TUploadModel | null = null;
	let cancelled = false;
	const tracker = trackUpload(() => {
		cancelled = true;
		if (uploadRecord) {
			cancelUpload(uploadRecord, rid);
		}
	});
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
		if (cancelled) {
			await cancelUpload(uploadRecord, rid);
			return;
		}
		const { file, getContent, fileContent } = await Encryption.encryptFile(rid, fileInfo);
		file.path = await copyFileToCacheDirectoryIfNeeded(file.path, file.name);
		if (cancelled) {
			return;
		}

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

		uploadQueue[uploadPath] = new FileUpload(`${server}/api/v1/rooms.media/${rid}`, headers, formData, async (loaded, total) => {
			tracker.progress(loaded, total);
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
		const response = await uploadQueue[uploadPath].send();

		let content;
		if (getContent) {
			content = await getContent(response.file._id, response.file.url);
		}
		if (cancelled) {
			return;
		}
		await fetch(`${server}/api/v1/rooms.mediaConfirm/${rid}/${response.file._id}`, {
			method: 'POST',
			headers: {
				...headers,
				'Content-Type': 'application/json'
			},
			body: getMediaConfirmBody({ file, tmid, content })
		});
		await db.write(async () => {
			await uploadRecord?.destroyPermanently();
		});
	} catch (e: any) {
		console.error(e);
		if (uploadPath && !uploadQueue[uploadPath]) {
			console.log('Upload cancelled');
		} else {
			await persistUploadError(fileInfo.path, rid);
			throw e;
		}
	} finally {
		tracker.end();
	}
}
