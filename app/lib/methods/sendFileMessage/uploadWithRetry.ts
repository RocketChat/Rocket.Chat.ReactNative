import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload } from '../helpers/fileUpload/definitions';
import { UploadHttpError } from '../helpers/fileUpload/UploadHttpError';
import { parseRetryAfterFromMessage } from '../helpers/parseRetryAfterFromMessage';
import { uploadQueue, uploadRetryWaits } from './utils';

const MAX_UPLOAD_ATTEMPTS = 4;

const BASE_RETRY_DELAY = 2000;
const MAX_TOTAL_RETRY_WAIT = 120000;

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

export const getUploadRetryDelay = (error: unknown, attempt: number, waited: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const retryAfterSeconds = error.retryAfterSeconds ?? parseRetryAfterFromMessage(error.serverMessage);
	const delay = retryAfterSeconds ? retryAfterSeconds * 1000 : BASE_RETRY_DELAY * 2 ** (attempt - 1);
	return waited + delay <= MAX_TOTAL_RETRY_WAIT ? delay : undefined;
};

const isCurrentAttempt = (uploadPath: string, upload: IFileUpload) => uploadQueue[uploadPath] === upload;

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
			if (!isCurrentAttempt(uploadPath, upload)) {
				throw new Error('Upload superseded by a newer attempt on the same path');
			}
			return response;
		} catch (error) {
			const delay = isCurrentAttempt(uploadPath, upload) ? getUploadRetryDelay(error, attempt, waited) : undefined;
			if (delay === undefined) {
				throw error;
			}
			waited += delay;
			await Promise.all([onRetryWait(), waitForRetry(uploadPath, delay)]);
			if (!isCurrentAttempt(uploadPath, upload)) {
				throw error;
			}
		}
	}
};
