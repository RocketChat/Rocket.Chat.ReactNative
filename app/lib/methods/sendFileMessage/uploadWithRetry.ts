import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload } from '../helpers/fileUpload/definitions';
import { getUploadRetryDelay } from '../helpers/getUploadRetryDelay';
import { ownsUploadSlot, uploadQueue, uploadRetryWaits } from './utils';

const waitForRetry = (uploadPath: string, delay: number) =>
	new Promise<void>(resolve => {
		const timer = setTimeout(resolve, delay);
		uploadRetryWaits[uploadPath] = () => {
			clearTimeout(timer);
			resolve();
		};
	}).finally(() => {
		delete uploadRetryWaits[uploadPath];
	});

export const uploadWithRetry = async (
	uploadPath: string,
	createUpload: () => IFileUpload,
	onRetryWait: () => Promise<void>
): Promise<TRoomsMediaResponse> => {
	let waited = 0;
	for (let attempt = 1; ; attempt += 1) {
		const upload = createUpload();
		uploadQueue[uploadPath] = upload;
		try {
			const response = await upload.send();
			if (!ownsUploadSlot(uploadPath, upload)) {
				throw new Error('Upload superseded by a newer attempt on the same path');
			}
			return response;
		} catch (error) {
			const delay = ownsUploadSlot(uploadPath, upload) ? getUploadRetryDelay(error, attempt, waited) : undefined;
			if (delay === undefined) {
				throw error;
			}
			waited += delay;
			await Promise.all([onRetryWait(), waitForRetry(uploadPath, delay)]);
			if (!ownsUploadSlot(uploadPath, upload)) {
				throw error;
			}
		}
	}
};
