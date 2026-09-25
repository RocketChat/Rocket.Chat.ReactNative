import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload, UploadHttpError, parseRetryAfterFromMessage } from '../helpers/fileUpload/definitions';
import { UploadSupersededError, uploadQueue } from './utils';

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

// A queue entry that is missing means this attempt was cancelled; one that points elsewhere means a
// newer attempt took over the same path. Only the latter should be hidden behind UploadSupersededError -
// callers still need to see a real cancellation to short-circuit their own cleanup.
const isSupersededByNewerAttempt = (uploadPath: string, upload: IFileUpload) => {
	const current = uploadQueue[uploadPath];
	return current !== undefined && current !== upload;
};

export const uploadWithRetry = async (uploadPath: string, createUpload: () => IFileUpload): Promise<TRoomsMediaResponse> => {
	for (let attempt = 1; ; attempt += 1) {
		const upload = createUpload();
		uploadQueue[uploadPath] = upload;
		try {
			const response = await upload.send();
			if (isSupersededByNewerAttempt(uploadPath, upload)) {
				throw new UploadSupersededError();
			}
			return response;
		} catch (error) {
			if (error instanceof UploadSupersededError || isSupersededByNewerAttempt(uploadPath, upload)) {
				throw error instanceof UploadSupersededError ? error : new UploadSupersededError();
			}
			const delay = getUploadRetryDelay(error, attempt);
			if (delay === undefined || uploadQueue[uploadPath] === undefined) {
				throw error;
			}
			await sleep(delay);
			if (isSupersededByNewerAttempt(uploadPath, upload)) {
				throw new UploadSupersededError();
			}
			if (uploadQueue[uploadPath] === undefined) {
				throw error;
			}
		}
	}
};
