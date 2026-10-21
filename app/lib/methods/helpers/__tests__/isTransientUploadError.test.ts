import { UploadHttpError } from '../fileUpload/UploadHttpError';
import { UploadNetworkError } from '../fileUpload/UploadNetworkError';
import { isTransientUploadError } from '../isTransientUploadError';

describe('isTransientUploadError', () => {
	it.each([
		['a lost connection', new UploadNetworkError()],
		['a server error', new UploadHttpError(500)],
		['a bad gateway', new UploadHttpError(502)],
		['the last server error status', new UploadHttpError(599)],
		['a rate limit', new UploadHttpError(429)]
	])('retries %s', (_, error) => {
		expect(isTransientUploadError(error)).toBe(true);
	});

	it.each([
		['a bad request', new UploadHttpError(400)],
		['an unauthorized request', new UploadHttpError(401)],
		['a forbidden request', new UploadHttpError(403)],
		['a request timeout response', new UploadHttpError(408)],
		['a missing resource', new UploadHttpError(404)],
		['the last client error status', new UploadHttpError(499)],
		['a room the user no longer has', new Error('Subscription not found')],
		['an unreadable server response', new Error('Upload failed: invalid server response')],
		['a rejection without a value', undefined]
	])('does not retry %s', (_, error) => {
		expect(isTransientUploadError(error)).toBe(false);
	});
});
