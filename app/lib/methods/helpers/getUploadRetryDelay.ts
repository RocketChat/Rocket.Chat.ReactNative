import { UploadHttpError } from './fileUpload/UploadHttpError';
import { parseRetryAfterFromMessage } from './parseRetryAfterFromMessage';

const MAX_UPLOAD_ATTEMPTS = 4;

const BASE_RETRY_DELAY = 2000;
const MAX_TOTAL_RETRY_WAIT = 120000;

export const getUploadRetryDelay = (error: unknown, attempt: number, waited: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const retryAfterSeconds = error.retryAfterSeconds ?? parseRetryAfterFromMessage(error.serverMessage);
	const delay = retryAfterSeconds ? retryAfterSeconds * 1000 : BASE_RETRY_DELAY * 2 ** (attempt - 1);
	return waited + delay <= MAX_TOTAL_RETRY_WAIT ? delay : undefined;
};
