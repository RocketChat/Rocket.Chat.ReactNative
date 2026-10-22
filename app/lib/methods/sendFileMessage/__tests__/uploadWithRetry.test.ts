import { uploadWithRetry } from '../uploadWithRetry';
import { uploadQueue, uploadRetryWaits } from '../utils';
import { UploadHttpError } from '../../helpers/fileUpload/UploadHttpError';

const PATH = '/tmp/pic.jpg-GENERAL';
const RESPONSE = { file: { _id: 'abc', url: '/file/abc' } } as any;

const uploadThat = (send: jest.Mock) => jest.fn(() => ({ send, cancel: jest.fn() }));

const onRetryWait = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
	Object.keys(uploadQueue).forEach(key => delete uploadQueue[key]);
	Object.keys(uploadRetryWaits).forEach(key => delete uploadRetryWaits[key]);
	onRetryWait.mockClear();
});

describe('uploadWithRetry', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('publishes the upload on the queue so it can be cancelled', async () => {
		const createUpload = uploadThat(jest.fn().mockResolvedValue(RESPONSE));

		await expect(uploadWithRetry(PATH, createUpload, onRetryWait)).resolves.toBe(RESPONSE);
		expect(uploadQueue[PATH]).toBeDefined();
	});

	it('builds a fresh upload for each attempt after a 429', async () => {
		const send = jest.fn().mockRejectedValueOnce(new UploadHttpError(429)).mockResolvedValueOnce(RESPONSE);
		const createUpload = uploadThat(send);

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait);
		await jest.advanceTimersByTimeAsync(2000);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(createUpload).toHaveBeenCalledTimes(2);
	});

	it('gives up after the attempt limit and throws the last failure', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait).catch(e => e);
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

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait);
		await jest.advanceTimersByTimeAsync(59999);
		expect(createUpload).toHaveBeenCalledTimes(1);
		await jest.advanceTimersByTimeAsync(1);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(createUpload).toHaveBeenCalledTimes(2);
	});

	it('stops and surfaces the failure when the rate limit wait is longer than two minutes', async () => {
		const serverMessage = 'You must wait 3600 seconds before trying this endpoint again. [error-too-many-requests]';
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429, { serverMessage })));

		await expect(uploadWithRetry(PATH, createUpload, onRetryWait)).rejects.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('does not retry a 413', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(413)));

		await expect(uploadWithRetry(PATH, createUpload, onRetryWait)).rejects.toMatchObject({ status: 413 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('gives up once the waits add up to more than two minutes', async () => {
		const send = jest
			.fn()
			.mockRejectedValueOnce(new UploadHttpError(429, { retryAfterSeconds: 100 }))
			.mockRejectedValueOnce(new UploadHttpError(429, { retryAfterSeconds: 30 }));
		const createUpload = uploadThat(send);

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait).catch(e => e);
		await jest.advanceTimersByTimeAsync(100000);

		await expect(pending).resolves.toMatchObject({ status: 429, retryAfterSeconds: 30 });
		expect(createUpload).toHaveBeenCalledTimes(2);
		expect(onRetryWait).toHaveBeenCalledTimes(1);
	});

	it('resets the progress once for each wait and leaves nothing registered afterwards', async () => {
		const send = jest
			.fn()
			.mockRejectedValueOnce(new UploadHttpError(429))
			.mockRejectedValueOnce(new UploadHttpError(429))
			.mockResolvedValueOnce(RESPONSE);

		const pending = uploadWithRetry(PATH, uploadThat(send), onRetryWait);
		await jest.advanceTimersByTimeAsync(6000);

		await expect(pending).resolves.toBe(RESPONSE);
		expect(onRetryWait).toHaveBeenCalledTimes(2);
		expect(uploadRetryWaits[PATH]).toBeUndefined();
	});

	it('does not reset the progress when the failure is not waited out', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(413)));

		await expect(uploadWithRetry(PATH, createUpload, onRetryWait)).rejects.toMatchObject({ status: 413 });
		expect(onRetryWait).not.toHaveBeenCalled();
	});

	it('ends the wait as soon as it is cancelled without starting another attempt', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429, { retryAfterSeconds: 60 })));

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait).catch(e => e);
		await jest.advanceTimersByTimeAsync(1000);
		delete uploadQueue[PATH];
		uploadRetryWaits[PATH]();

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
		expect(uploadRetryWaits[PATH]).toBeUndefined();
		expect(jest.getTimerCount()).toBe(0);
	});

	it('stops when the upload is cancelled while backing off', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait).catch(e => e);
		await jest.advanceTimersByTimeAsync(1000);
		delete uploadQueue[PATH];
		await jest.advanceTimersByTimeAsync(1000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('stops retrying when a new upload reused the path while backing off', async () => {
		const createUpload = uploadThat(jest.fn().mockRejectedValue(new UploadHttpError(429)));

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait).catch(e => e);
		await jest.advanceTimersByTimeAsync(1000);
		uploadQueue[PATH] = { send: jest.fn().mockResolvedValue(RESPONSE), cancel: jest.fn() };
		await jest.advanceTimersByTimeAsync(1000);

		await expect(pending).resolves.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});

	it('does not resolve as successful when a newer attempt has already taken over the queue entry', async () => {
		const createUpload = uploadThat(jest.fn().mockResolvedValue(RESPONSE));

		const pending = uploadWithRetry(PATH, createUpload, onRetryWait);
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

		await expect(uploadWithRetry(PATH, createUpload, onRetryWait)).rejects.toThrow('superseded');
	});

	it('stops when the upload is cancelled during the request', async () => {
		const createUpload = uploadThat(
			jest.fn(() => {
				delete uploadQueue[PATH];
				return Promise.reject(new UploadHttpError(429));
			})
		);

		await expect(uploadWithRetry(PATH, createUpload, onRetryWait)).rejects.toMatchObject({ status: 429 });
		expect(createUpload).toHaveBeenCalledTimes(1);
	});
});
