import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload, UploadHttpError } from '../helpers/fileUpload/definitions';
import { uploadQueue } from './utils';

export const MAX_UPLOAD_ATTEMPTS = 4;

const BASE_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 30000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const getUploadRetryDelay = (error: unknown, attempt: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const delay = error.retryAfterSeconds ? error.retryAfterSeconds * 1000 : BASE_RETRY_DELAY * 2 ** (attempt - 1);
	return Math.min(delay, MAX_RETRY_DELAY);
};

export const uploadWithRetry = async (uploadPath: string, createUpload: () => IFileUpload): Promise<TRoomsMediaResponse> => {
	for (let attempt = 1; ; attempt += 1) {
		const upload = createUpload();
		uploadQueue[uploadPath] = upload;
		try {
			return await upload.send();
		} catch (error) {
			const delay = getUploadRetryDelay(error, attempt);
			if (delay === undefined || uploadQueue[uploadPath] !== upload) {
				throw error;
			}
			await sleep(delay);
			if (uploadQueue[uploadPath] !== upload) {
				throw error;
			}
		}
	}
};
