import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload, UploadHttpError } from '../helpers/fileUpload/definitions';
import { uploadQueue } from './utils';

export const MAX_UPLOAD_ATTEMPTS = 3;

const BASE_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 30000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * How long to wait before trying the same upload again, or undefined to give up.
 * Rate limiting is the only failure that clears itself: everything else either
 * works the first time or needs the user to change something.
 */
export const getUploadRetryDelay = (error: unknown, attempt: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const delay = error.retryAfterSeconds ? error.retryAfterSeconds * 1000 : BASE_RETRY_DELAY * 2 ** (attempt - 1);
	return Math.min(delay, MAX_RETRY_DELAY);
};

/**
 * An XMLHttpRequest cannot be sent twice, so every attempt builds a new upload and
 * publishes it on the queue under the same path — that is what cancelUpload aborts.
 * A missing queue entry means the user cancelled, and the attempt is not repeated.
 */
export const uploadWithRetry = async (uploadPath: string, createUpload: () => IFileUpload): Promise<TRoomsMediaResponse> => {
	for (let attempt = 1; ; attempt += 1) {
		uploadQueue[uploadPath] = createUpload();
		try {
			return await uploadQueue[uploadPath].send();
		} catch (error) {
			const delay = getUploadRetryDelay(error, attempt);
			if (delay === undefined || !uploadQueue[uploadPath]) {
				throw error;
			}
			await sleep(delay);
			if (!uploadQueue[uploadPath]) {
				throw error;
			}
		}
	}
};
