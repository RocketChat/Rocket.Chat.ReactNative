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
import { getUploadErrorMessage, isRetryableUploadError } from '../helpers/uploadError';
import { type IFileUpload } from '../helpers/fileUpload/definitions';
import { UploadHttpError } from '../helpers/fileUpload/UploadHttpError';

export const uploadQueue: { [index: string]: IFileUpload } = {};

export const uploadRetryWaits: { [index: string]: () => void } = {};

export const getUploadPath = (path: string, rid: string) => `${path}-${rid}`;

export function isUploadActive(path: string, rid: string): boolean {
	return !!uploadQueue[getUploadPath(path, rid)];
}

export const releaseUploadSlot = (uploadPath: string, upload: IFileUpload | null) => {
	if (uploadQueue[uploadPath] === upload) {
		delete uploadQueue[uploadPath];
	}
};

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
	uploadRetryWaits[uploadPath]?.();
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

export const persistUploadError = async (uploadPath: string, errorStatus?: number, errorMessage?: string) => {
	try {
		const db = database.active;
		const uploadRecord = await getUploadByPath(uploadPath);
		if (!uploadRecord) {
			return;
		}
		await db.write(async () => {
			await uploadRecord.update(u => {
				u.error = true;
				u.errorStatus = errorStatus;
				u.errorMessage = errorMessage;
			});
		});
	} catch {
		// Do nothing
	}
};

export const finalizeFailedUpload = async ({
	uploadPath,
	error,
	upload
}: {
	uploadPath: string;
	error: unknown;
	upload: IFileUpload | null;
}): Promise<void> => {
	if (upload && uploadQueue[uploadPath] !== upload) {
		return;
	}
	releaseUploadSlot(uploadPath, upload);
	const httpError = error instanceof UploadHttpError ? error : undefined;
	const errorStatus = httpError?.status;
	const errorMessage = httpError?.serverMessage;
	await persistUploadError(uploadPath, errorStatus, errorMessage);
	const reason = getUploadErrorMessage({ errorStatus, errorMessage });
	if (reason && !isRetryableUploadError(errorStatus)) {
		showToast(reason);
	}
	throw error;
};

export const createUploadProgressCallback =
	(db: Database, uploadRecord: TUploadModel) =>
	async (loaded: number, total: number): Promise<void> => {
		try {
			await db.write(async () => {
				await uploadRecord.update(u => {
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
			// Record left behind by a crashed or failed upload: reset and reuse it.
			await db.write(async () => {
				await uploadRecord?.update(u => {
					u.error = false;
					u.errorStatus = undefined;
					u.errorMessage = undefined;
					u.progress = 0;
					u.tmid = tmid;
					u.description = fileInfo.description;
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
