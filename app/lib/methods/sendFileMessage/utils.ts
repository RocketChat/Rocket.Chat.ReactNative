import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import isEmpty from 'lodash/isEmpty';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

import { getUploadByPath } from '../../database/services/Upload';
import { IUpload, TUploadModel } from '../../../definitions';
import i18n from '../../../i18n';
import database from '../../database';
import log from '../helpers/log';
import { IFileUpload } from '../helpers/fileUpload/definitions';

export const uploadQueue: { [index: string]: IFileUpload } = {};

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

export const persistUploadError = async (path: string, rid: string) => {
	try {
		const db = database.active;
		const uploadRecord = await getUploadByPath(getUploadPath(path, rid));
		if (!uploadRecord) {
			return;
		}
		await db.write(async () => {
			await uploadRecord.update(u => {
				u.error = true;
			});
		});
	} catch {
		// Do nothing
	}
};

export const createUploadRecord = async ({
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
