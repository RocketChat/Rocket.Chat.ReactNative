import { getUploadRetryDelay, uploadWithRetry } from '../uploadWithRetry';
import { uploadQueue } from '../utils';
import { UploadHttpError } from '../../helpers/fileUpload/UploadHttpError';

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

	it('retries a 429 three times and then stops', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429), 3)).toBe(8000);
		expect(getUploadRetryDelay(new UploadHttpError(429), 4)).toBeUndefined();
	});

	it('honours Retry-After over its own backoff', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 5 }), 1)).toBe(5000);
	});

	it('waits as long as the rate limit message asks when there is no Retry-After', () => {
		const serverMessage =
			'Error, too many requests. Please slow down. You must wait 12 seconds before trying this endpoint again. [error-too-many-requests]';
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage }), 1)).toBe(12000);
	});

	it('prefers Retry-After over the rate limit message', () => {
		const serverMessage = 'You must wait 12 seconds before trying this endpoint again.';
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage, retryAfterSeconds: 5 }), 1)).toBe(5000);
	});

	it('waits out the whole rate limit window the server asks for, up to two minutes', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 60 }), 1)).toBe(60000);
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage: 'You must wait 120 seconds' }), 1)).toBe(120000);
	});

	it('gives up instead of holding the upload for longer than two minutes', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 121 }), 1)).toBeUndefined();
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage: 'You must wait 3600 seconds' }), 1)).toBeUndefined();
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
		expect(createUpload).toHaveBeenCalledTimes(4);
	});

	it('does not retry before the rate limit window the server asked for has passed', async () => {
		const serverMessage = 'You must wait 60 seconds before trying this endpoint again. [error-too-many-requests]';
		const send = jest.fn().mockRejectedValueOnce(new UploadHttpError(429, { serverMessage })).mockResolvedValueOnce(RESPONSE);
		const createUpload = uploadThat(send);

		const pending = uploadWithRetry(PATH, createUpload);
		await jest.advanceTimersByTimeAsync(59999);
		expect(createUpload).toHaveBeenCalledTimes(1);
		await jest.advanceTimersByTimeAsync(1);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(createUpload).toHaveBeenCalledTimes(2);
	});

	it('stops and surfaces the failure when the rate limit wait is longer than two minutes', async () => {
		const serverMessage = 'You must wait 3600 seconds before trying this endpoint again. [error-too-many-requests]';
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429, { serverMessage })));

		await expect(uploadWithRetry(PATH, createUpload)).rejects.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
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

	it('stops retrying when a new upload reused the path while backing off', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload).catch(e => e);
		await jest.advanceTimersByTimeAsync(1000);
		uploadQueue[PATH] = { send: jest.fn().mockResolvedValue(RESPONSE), cancel: jest.fn() };
		await jest.advanceTimersByTimeAsync(1000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('does not resolve as successful when a newer attempt has already taken over the queue entry', async () => {
		const createUpload = uploadThat(jest.fn().mockResolvedValue(RESPONSE));

		const pending = uploadWithRetry(PATH, createUpload);
		uploadQueue[PATH] = { send: jest.fn().mockResolvedValue(RESPONSE), cancel: jest.fn() };

		await expect(pending).rejects.toThrow('superseded');
	});

	it('does not resolve as successful when the upload was cancelled just before the response arrived', async () => {
		const createUpload = uploadThat(
			jest.fn(() => {
				delete uploadQueue[PATH];
				return Promise.resolve(RESPONSE);
			})
		);

		await expect(uploadWithRetry(PATH, createUpload)).rejects.toThrow('superseded');
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
