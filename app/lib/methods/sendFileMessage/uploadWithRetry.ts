import { type TRoomsMediaResponse } from '~/definitions/rest/v1/rooms';
import { type IFileUpload } from '../helpers/fileUpload/definitions';
import { getUploadRetryDelay } from '../helpers/getUploadRetryDelay';
import { ownsUploadSlot, uploadQueue, uploadRetryWaits } from './utils';

interface IRateLimitedStep<T> {
	slot: IFileUpload | null;
	result: Promise<T>;
}

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

export const retryWhileRateLimited = async <T>(
	uploadPath: string,
	startStep: () => IRateLimitedStep<T>,
	onRetryWait: () => Promise<void>
): Promise<T> => {
	let waited = 0;
	for (let attempt = 1; ; attempt += 1) {
		const { slot, result } = startStep();
		try {
			const value = await result;
			if (!ownsUploadSlot(uploadPath, slot)) {
				throw new Error('Upload superseded by a newer attempt on the same path');
			}
			return value;
		} catch (error) {
			const delay = ownsUploadSlot(uploadPath, slot) ? getUploadRetryDelay(error, attempt, waited) : undefined;
			if (delay === undefined) {
				throw error;
			}
			waited += delay;
			await Promise.all([onRetryWait(), waitForRetry(uploadPath, delay)]);
			if (!ownsUploadSlot(uploadPath, slot)) {
				throw error;
			}
		}
	}
};

export const uploadWithRetry = (
	uploadPath: string,
	createUpload: () => IFileUpload,
	onRetryWait: () => Promise<void>
): Promise<TRoomsMediaResponse> =>
	retryWhileRateLimited(
		uploadPath,
		() => {
			const upload = createUpload();
			uploadQueue[uploadPath] = upload;
			return { slot: upload, result: upload.send() };
		},
		onRetryWait
	);
