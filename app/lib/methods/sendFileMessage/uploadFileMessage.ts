import { type TSendFileMessageFileInfo } from '~/definitions';
import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import database from '~/lib/database';
import FileUpload from '../helpers/fileUpload';
import { type IFileUpload, type IFormData, type TUploadHeaders } from '../helpers/fileUpload/definitions';
import { createUploadProgressCallback, createUploadRecord, finalizeFailedUpload, releaseUploadSlot } from './utils';
import { retryWhileRateLimited, uploadWithRetry } from './uploadWithRetry';

interface IPreparedUpload {
	url: string;
	headers: TUploadHeaders;
	formData: IFormData[];
	afterUpload?: (response: TRoomsMediaResponse) => Promise<void>;
}

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
	const uploadRecord = await createUploadRecord({ rid, fileInfo, tmid });
	const uploadPath = uploadRecord.id;

	let upload: IFileUpload | null = null;
	try {
		const db = database.active;
		const { url, headers, formData, afterUpload } = await prepare();

		const updateProgress = createUploadProgressCallback(db, uploadRecord);
		const response = await uploadWithRetry(
			uploadPath,
			() => {
				upload = new FileUpload(url, headers, formData, updateProgress);
				return upload;
			},
			() => updateProgress(0, 1)
		);
		if (afterUpload) {
			await retryWhileRateLimited(
				uploadPath,
				() => ({ slot: upload, result: afterUpload(response) }),
				async () => {}
			);
		}
		await db.write(async () => {
			await uploadRecord.destroyPermanently();
		});
		releaseUploadSlot(uploadPath, upload);
	} catch (e) {
		await finalizeFailedUpload({ uploadPath, error: e, upload });
	}
}
