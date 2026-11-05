import { UploadHttpError } from '../helpers/fileUpload/UploadHttpError';
import { parseRetryAfterFromMessage } from '../helpers/retryAfter';

const MAX_UPLOAD_ATTEMPTS = 4;

const BASE_RETRY_DELAY = 2000;
const MAX_TOTAL_RETRY_WAIT = 120000;

const getBackoffDelay = (attempt: number) => Math.round(BASE_RETRY_DELAY * 2 ** (attempt - 1) * (0.5 + Math.random()));

const getRetryDelay = (error: unknown, attempt: number, waited: number): number | undefined => {
	if (!(error instanceof UploadHttpError) || error.status !== 429 || attempt >= MAX_UPLOAD_ATTEMPTS) {
		return undefined;
	}
	const retryAfterSeconds = error.retryAfterSeconds ?? parseRetryAfterFromMessage(error.serverMessage);
	const delay = retryAfterSeconds ? retryAfterSeconds * 1000 : getBackoffDelay(attempt);
	return waited + delay <= MAX_TOTAL_RETRY_WAIT ? delay : undefined;
};

const throwIfCancelled = (signal: AbortSignal) => {
	if (signal.aborted) {
		throw new Error('Upload Cancelled');
	}
};

const waitForRetry = (signal: AbortSignal, delay: number) =>
	new Promise<void>(resolve => {
		const timer = setTimeout(resolve, delay);
		signal.addEventListener('abort', () => {
			clearTimeout(timer);
			resolve();
		});
	});

export const retryWhileRateLimited = async <T>(
	signal: AbortSignal,
	startStep: () => Promise<T>,
	onRetryWait: () => Promise<void>
): Promise<T> => {
	let waited = 0;
	for (let attempt = 1; ; attempt += 1) {
		throwIfCancelled(signal);
		try {
			const value = await startStep();
			throwIfCancelled(signal);
			return value;
		} catch (error) {
			const delay = signal.aborted ? undefined : getRetryDelay(error, attempt, waited);
			if (delay === undefined) {
				throw error;
			}
			waited += delay;
			await Promise.all([onRetryWait(), waitForRetry(signal, delay)]);
		}
	}
};
