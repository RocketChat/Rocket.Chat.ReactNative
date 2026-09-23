import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload, UploadHttpError, parseRetryAfterFromMessage } from '../helpers/fileUpload/definitions';
import { uploadQueue } from './utils';

export const MAX_UPLOAD_ATTEMPTS = 4;

const BASE_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 30000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const getUploadRetryDelay = (error: unknown, attempt: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const retryAfterSeconds = error.retryAfterSeconds ?? parseRetryAfterFromMessage(error.serverMessage);
	const delay = retryAfterSeconds ? retryAfterSeconds * 1000 : BASE_RETRY_DELAY * 2 ** (attempt - 1);
	return delay <= MAX_RETRY_DELAY ? delay : undefined;
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
