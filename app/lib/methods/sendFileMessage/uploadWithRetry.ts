import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload, UploadHttpError, parseRetryAfterFromMessage } from '../helpers/fileUpload/definitions';
import { UploadSupersededError, uploadQueue } from './utils';

export const MAX_UPLOAD_ATTEMPTS = 4;

const BASE_RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const getUploadRetryDelay = (error: unknown, attempt: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const retryAfterSeconds = error.retryAfterSeconds ?? parseRetryAfterFromMessage(error.serverMessage);
	return retryAfterSeconds ? retryAfterSeconds * 1000 : BASE_RETRY_DELAY * 2 ** (attempt - 1);
};

const isCurrentAttempt = (uploadPath: string, upload: IFileUpload) => uploadQueue[uploadPath] === upload;

export const uploadWithRetry = async (uploadPath: string, createUpload: () => IFileUpload): Promise<TRoomsMediaResponse> => {
	for (let attempt = 1; ; attempt += 1) {
		const upload = createUpload();
		uploadQueue[uploadPath] = upload;
		try {
			const response = await upload.send();
			if (!isCurrentAttempt(uploadPath, upload)) {
				throw new UploadSupersededError();
			}
			return response;
		} catch (error) {
			const delay = isCurrentAttempt(uploadPath, upload) ? getUploadRetryDelay(error, attempt) : undefined;
			if (delay === undefined) {
				throw error;
			}
			await sleep(delay);
			if (!isCurrentAttempt(uploadPath, upload)) {
				throw error;
			}
		}
	}
};
