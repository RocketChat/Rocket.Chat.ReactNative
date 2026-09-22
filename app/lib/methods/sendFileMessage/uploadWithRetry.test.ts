import { MAX_UPLOAD_ATTEMPTS, getUploadRetryDelay, uploadWithRetry } from './uploadWithRetry';
import { uploadQueue } from './utils';
import { UploadHttpError } from '../helpers/fileUpload/definitions';

jest.mock('./utils', () => ({ uploadQueue: {} }));

const PATH = '/tmp/pic.jpg-GENERAL';
const RESPONSE = { file: { _id: 'abc', url: '/file/abc' } } as any;

const uploadThat = (send: jest.Mock) => jest.fn(() => ({ send, cancel: jest.fn() }));

beforeEach(() => {
	Object.keys(uploadQueue).forEach(key => delete uploadQueue[key]);
});

describe('getUploadRetryDelay', () => {
	it('never retries something that is not an http failure', () => {
		expect(getUploadRetryDelay(new Error('Network Error'), 1)).toBeUndefined();
	});

	it.each([[400], [413], [500], [503]])('never retries a %p', status => {
		expect(getUploadRetryDelay(new UploadHttpError(status), 1)).toBeUndefined();
	});

	it('backs off exponentially on a 429', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429), 1)).toBe(2000);
		expect(getUploadRetryDelay(new UploadHttpError(429), 2)).toBe(4000);
	});

	it('stops at the attempt limit', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429), MAX_UPLOAD_ATTEMPTS)).toBeUndefined();
	});

	it('honours Retry-After over its own backoff', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 5 }), 1)).toBe(5000);
	});

	it('refuses to wait longer than 30 seconds', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 600 }), 1)).toBe(30000);
	});
});

describe('uploadWithRetry', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('publishes the upload on the queue so it can be cancelled', async () => {
		const createUpload = uploadThat(jest.fn().mockResolvedValue(RESPONSE));

		await expect(uploadWithRetry(PATH, createUpload)).resolves.toBe(RESPONSE);
		expect(uploadQueue[PATH]).toBeDefined();
	});

	it('builds a fresh upload for each attempt after a 429', async () => {
		const send = jest.fn().mockRejectedValueOnce(new UploadHttpError(429)).mockResolvedValueOnce(RESPONSE);
		const createUpload = uploadThat(send);

		const pending = uploadWithRetry(PATH, createUpload);
		await jest.advanceTimersByTimeAsync(2000);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(createUpload).toHaveBeenCalledTimes(2);
	});

	it('gives up after the attempt limit and throws the last failure', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload).catch(e => e);
		await jest.advanceTimersByTimeAsync(2000);
		await jest.advanceTimersByTimeAsync(4000);
		await jest.advanceTimersByTimeAsync(8000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(MAX_UPLOAD_ATTEMPTS);
	});

	it('does not retry a 413', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(413)));

		await expect(uploadWithRetry(PATH, createUpload)).rejects.toMatchObject({ status: 413 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('stops when the upload is cancelled while backing off', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload).catch(e => e);
		await jest.advanceTimersByTimeAsync(1000);
		delete uploadQueue[PATH];
		await jest.advanceTimersByTimeAsync(1000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('stops when a new upload reused the path while backing off', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload).catch(e => e);
		await jest.advanceTimersByTimeAsync(1000);
		uploadQueue[PATH] = { send: jest.fn().mockResolvedValue(RESPONSE), cancel: jest.fn() };
		await jest.advanceTimersByTimeAsync(1000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('stops when the upload is cancelled during the request', async () => {
		const createUpload = uploadThat(
			jest.fn(() => {
				delete uploadQueue[PATH];
				return Promise.reject(new UploadHttpError(429));
			})
		);

		await expect(uploadWithRetry(PATH, createUpload)).rejects.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});
});
