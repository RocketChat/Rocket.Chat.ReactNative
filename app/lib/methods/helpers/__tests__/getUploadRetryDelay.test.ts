import { getUploadRetryDelay } from '../getUploadRetryDelay';
import { UploadHttpError } from '../fileUpload/UploadHttpError';

describe('getUploadRetryDelay', () => {
	it('never retries something that is not an http failure', () => {
		expect(getUploadRetryDelay(new Error('Network Error'), 1, 0)).toBeUndefined();
	});

	it.each([[400], [413], [500], [503]])('never retries a %p', status => {
		expect(getUploadRetryDelay(new UploadHttpError(status), 1, 0)).toBeUndefined();
	});

	it('backs off exponentially on a 429', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429), 1, 0)).toBe(2000);
		expect(getUploadRetryDelay(new UploadHttpError(429), 2, 0)).toBe(4000);
	});

	it('retries a 429 three times and then stops', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429), 3, 0)).toBe(8000);
		expect(getUploadRetryDelay(new UploadHttpError(429), 4, 0)).toBeUndefined();
	});

	it('honours Retry-After over its own backoff', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 5 }), 1, 0)).toBe(5000);
	});

	it('waits as long as the rate limit message asks when there is no Retry-After', () => {
		const serverMessage =
			'Error, too many requests. Please slow down. You must wait 12 seconds before trying this endpoint again. [error-too-many-requests]';
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage }), 1, 0)).toBe(12000);
	});

	it('prefers Retry-After over the rate limit message', () => {
		const serverMessage = 'You must wait 12 seconds before trying this endpoint again.';
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage, retryAfterSeconds: 5 }), 1, 0)).toBe(5000);
	});

	it('waits out the whole rate limit window the server asks for, up to two minutes', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 60 }), 1, 0)).toBe(60000);
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage: 'You must wait 120 seconds' }), 1, 0)).toBe(120000);
	});

	it('gives up instead of holding the upload for longer than two minutes', () => {
		expect(getUploadRetryDelay(new UploadHttpError(429, { retryAfterSeconds: 121 }), 1, 0)).toBeUndefined();
		expect(getUploadRetryDelay(new UploadHttpError(429, { serverMessage: 'You must wait 3600 seconds' }), 1, 0)).toBeUndefined();
	});

	it('counts the time already waited against the two minute limit', () => {
		const error = new UploadHttpError(429, { retryAfterSeconds: 60 });

		expect(getUploadRetryDelay(error, 2, 60000)).toBe(60000);
		expect(getUploadRetryDelay(error, 2, 60001)).toBeUndefined();
	});
});
