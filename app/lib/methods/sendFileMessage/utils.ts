import { type Database } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import isEmpty from 'lodash/isEmpty';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { getUploadByPath } from '~/lib/database/services/Upload';
import { type IUpload, type TUploadModel } from '~/definitions';
import i18n from '~/i18n';
import database from '~/lib/database';
import log from '../helpers/log';
import { showToast } from '../helpers/showToast';
import { getUploadErrorMessage } from '../helpers/getUploadErrorMessage';
import { isRetryableUploadError } from '../helpers/isRetryableUploadError';
import { type IFileUpload, UploadHttpError } from '../helpers/fileUpload/definitions';

export const uploadQueue: { [index: string]: IFileUpload } = {};

export class UploadSupersededError extends Error {
	constructor() {
		super('Upload superseded by a newer attempt on the same path');
		this.name = 'UploadSupersededError';
	}
}

export const getUploadPath = (path: string, rid: string) => `${path}-${rid}`;

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

export const persistUploadError = async (path: string, rid: string, error?: unknown) => {
	try {
		const db = database.active;
		const uploadRecord = await getUploadByPath(getUploadPath(path, rid));
		if (!uploadRecord) {
			return;
		}
		const errorStatus = error instanceof UploadHttpError ? error.status : undefined;
		const errorMessage = error instanceof UploadHttpError ? error.serverMessage : undefined;
		await db.write(async () => {
			await uploadRecord.update(u => {
				u.error = true;
				u.errorStatus = errorStatus;
				u.errorMessage = errorMessage;
			});
		});
		const reason = getUploadErrorMessage({ errorStatus, errorMessage });
		if (reason && !isRetryableUploadError(errorStatus)) {
			showToast(reason);
		}
	} catch {
		// Do nothing
	}
};

export const finalizeFailedUpload = async ({
	queueKey,
	filePath,
	rid,
	error,
	upload
}: {
	queueKey: string;
	filePath: string;
	rid: string;
	error: unknown;
	upload: IFileUpload | null;
}): Promise<void> => {
	if (error instanceof UploadSupersededError) {
		return;
	}
	const owner = queueKey ? uploadQueue[queueKey] : undefined;
	// owner undefined can mean two different things: a real cancellation (the attempt was queued, then removed),
	// or a failure that happened before this attempt was ever queued (upload is still null) - only the former is a cancellation.
	if (queueKey && upload && !owner) {
		console.log('Upload cancelled');
		return;
	}
	if (queueKey && owner !== undefined && owner !== upload) {
		return;
	}
	if (queueKey && owner) {
		delete uploadQueue[queueKey];
	}
	await persistUploadError(filePath, rid, error);
	throw error;
};

export const createUploadProgressCallback =
	(db: Database, uploadRecord: TUploadModel | null) =>
	async (loaded: number, total: number): Promise<void> => {
		try {
			await db.write(async () => {
				await uploadRecord?.update(u => {
					u.progress = Math.floor((loaded / total) * 100);
				});
			});
		} catch (e) {
			console.error(e);
		}
	};

export const createUploadRecord = async ({
	rid,
	fileInfo,
	tmid
}: {
	rid: string;
	fileInfo: IUpload;
	tmid: string | undefined;
}) => {
	const db = database.active;
	const uploadsCollection = db.get('uploads');
	const uploadPath = getUploadPath(fileInfo.path, rid);
	let uploadRecord: TUploadModel | null = null;
	try {
		uploadRecord = await uploadsCollection.find(uploadPath);
		if (uploadRecord.id) {
			if (isUploadActive(fileInfo.path, rid)) {
				Alert.alert(i18n.t('FileUpload_Error'), i18n.t('Upload_in_progress'));
				return [null, null];
			}
			// Record left behind by a crashed or failed upload, or by a previous attempt the user is now retrying: reset and reuse it.
			await db.write(async () => {
				await uploadRecord?.update(u => {
					u.error = false;
					u.errorStatus = undefined;
					u.errorMessage = undefined;
					u.progress = 0;
				});
			});
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

export const copyFileToCacheDirectoryIfNeeded = async (path: string, name?: string) => {
	if (!path.startsWith('file://') && name) {
		if (!FileSystem.cacheDirectory) {
			throw new Error('No cache dir');
		}
		const newPath = `${FileSystem.cacheDirectory}/${name}`;
		await FileSystem.copyAsync({ from: path, to: newPath });
		return newPath;
	}
	return path;
};
