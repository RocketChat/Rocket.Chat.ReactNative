import { type TSendFileMessageFileInfo, type TUploadModel } from '~/definitions';
import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import database from '~/lib/database';
import FileUpload from '../helpers/fileUpload';
import { type IFormData, type TUploadHeaders } from '../helpers/fileUpload/definitions';
import {
	claimUploadSlot,
	createUploadProgressCallback,
	createUploadRecord,
	getUploadPath,
	type IUploadSlot,
	recordUploadFailure,
	releaseUploadSlot
} from './utils';
import { retryWhileRateLimited } from './retryWhileRateLimited';

interface IPreparedUpload {
	url: string;
	headers: TUploadHeaders;
	formData: IFormData[];
	afterUpload?: (response: TRoomsMediaResponse) => Promise<void>;
}

const sendPreparedUpload = async (
	uploadRecord: TUploadModel,
	slot: IUploadSlot,
	prepare: () => Promise<IPreparedUpload>
): Promise<void> => {
	const db = database.active;
	const { signal } = slot.controller;
	const { url, headers, formData, afterUpload } = await prepare();

	const updateProgress = createUploadProgressCallback(db, uploadRecord);
	const resetProgress = () => updateProgress(0, 1);
	const response = await retryWhileRateLimited(
		signal,
		() => {
			slot.upload = new FileUpload(url, headers, formData, updateProgress);
			return slot.upload.send();
		},
		resetProgress
	);
	if (afterUpload) {
		await retryWhileRateLimited(signal, () => afterUpload(response), resetProgress);
	}
	await db.write(async () => {
		await uploadRecord.destroyPermanently();
	});
};

export async function uploadFileMessage({
	rid,
	fileInfo,
	tmid,
	prepare
}: {
	rid: string;
	fileInfo: TSendFileMessageFileInfo;
	tmid: string | undefined;
	prepare: () => Promise<IPreparedUpload>;
}): Promise<void> {
	const uploadPath = getUploadPath(fileInfo.path, rid);
	const slot = claimUploadSlot(uploadPath);
	let uploadRecord: TUploadModel | undefined;
	try {
		uploadRecord = await createUploadRecord({ rid, fileInfo, tmid });
		await sendPreparedUpload(uploadRecord, slot, prepare);
	} catch (e) {
		if (slot.controller.signal.aborted) {
			return;
		}
		if (uploadRecord) {
			await recordUploadFailure(uploadRecord, e);
		}
		throw e;
	} finally {
		releaseUploadSlot(uploadPath, slot);
	}
}
