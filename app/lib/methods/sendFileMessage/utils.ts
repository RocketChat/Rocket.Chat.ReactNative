import { type Database } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
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

export interface IUploadSlot {
	controller: AbortController;
	upload?: IFileUpload;
}

export const uploadQueue: { [index: string]: IUploadSlot } = {};

export const getUploadPath = (path: string, rid: string) => `${path}-${rid}`;

export function isUploadActive(path: string, rid: string): boolean {
	return !!uploadQueue[getUploadPath(path, rid)];
}

export const claimUploadSlot = (uploadPath: string): IUploadSlot => {
	if (uploadQueue[uploadPath]) {
		Alert.alert(i18n.t('FileUpload_Error'), i18n.t('Upload_in_progress'));
		throw new Error('Upload in progress');
	}
	const slot = { controller: new AbortController() };
	uploadQueue[uploadPath] = slot;
	return slot;
};

export const releaseUploadSlot = (uploadPath: string, slot: IUploadSlot) => {
	if (uploadQueue[uploadPath] === slot) {
		delete uploadQueue[uploadPath];
	}
};

export async function cancelUpload(item: TUploadModel, rid: string): Promise<void> {
	const uploadPath = getUploadPath(item.path, rid);
	const slot = uploadQueue[uploadPath];
	if (slot) {
		delete uploadQueue[uploadPath];
		slot.controller.abort();
		try {
			await slot.upload?.cancel();
		} catch {
			// Do nothing
		}
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

const getUploadFailure = (error: unknown): Pick<IUpload, 'errorStatus' | 'errorMessage'> =>
	error instanceof UploadHttpError ? { errorStatus: error.status, errorMessage: error.serverMessage } : {};

export const recordUploadFailure = async (uploadRecord: TUploadModel, error: unknown): Promise<void> => {
	const { errorStatus, errorMessage } = getUploadFailure(error);
	try {
		await uploadRecord.db.write(async () => {
			await uploadRecord.update(u => {
				u.error = true;
				u.errorStatus = errorStatus;
				u.errorMessage = errorMessage;
			});
		});
	} catch (e) {
		log(e);
	}
};

export const showUploadFailureToast = (error: unknown): void => {
	const failure = getUploadFailure(error);
	const reason = getUploadErrorMessage(failure);
	if (reason && !isRetryableUploadError(failure.errorStatus)) {
		showToast(reason);
	}
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
	const existing = await getUploadByPath(uploadPath);
	if (existing) {
		// Record left behind by a crashed or failed upload: reset and reuse it.
		await db.write(async () => {
			await existing.update(u => {
				u.error = false;
				u.errorStatus = undefined;
				u.errorMessage = undefined;
				u.progress = 0;
				u.tmid = tmid;
				u.description = fileInfo.description;
			});
		});
		return existing;
	}
	const created: TUploadModel = await db.write(() =>
		uploadsCollection.create(u => {
			u._raw = sanitizedRaw({ id: uploadPath }, uploadsCollection.schema);
			Object.assign(u, fileInfo);
			if (tmid) {
				u.tmid = tmid;
			}
			if (u.subscription) {
				u.subscription.id = rid;
			}
		})
	);
	return created;
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
