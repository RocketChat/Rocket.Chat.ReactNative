import { HttpError } from '../HttpError';
import { throwIfHttpError } from '../throwIfHttpError';

const getError = (status: number, body: string, retryAfterHeader?: string | null) => {
	try {
		throwIfHttpError(status, body, retryAfterHeader);
	} catch (error) {
		return error;
	}
	return undefined;
};

describe('throwIfHttpError', () => {
	it('does nothing for a 2xx response', () => {
		expect(getError(200, '{}')).toBeUndefined();
	});

	it('throws an HttpError carrying the status and the server message', () => {
		const error = getError(413, '{"error":"File is too large"}');

		expect(error).toBeInstanceOf(HttpError);
		expect(error).toMatchObject({ status: 413, serverMessage: 'File is too large' });
	});

	it('carries the wait of the Retry-After header', () => {
		expect(getError(429, '{}', '12')).toMatchObject({ status: 429, retryAfterSeconds: 12 });
	});

	it('takes the retry wait from the server message when no Retry-After header came', () => {
		const body = '{"error":"You must wait 60 seconds before trying this endpoint again. [error-too-many-requests]"}';

		expect(getError(429, body, null)).toMatchObject({ status: 429, retryAfterSeconds: 60 });
	});

	it('prefers the Retry-After header over the wait in the server message', () => {
		const body = '{"error":"You must wait 12 seconds before trying this endpoint again."}';

		expect(getError(429, body, '5')).toMatchObject({ retryAfterSeconds: 5 });
	});

	it('treats a 3xx as an HTTP error instead of a success', () => {
		expect(getError(302, '<html>Found</html>')).toMatchObject({ name: 'HttpError', status: 302 });
	});
});

describe('server message of a failed response', () => {
	const parseServerMessage = (body: string) => (getError(500, body) as HttpError).serverMessage;

	it('returns nothing for an empty body', () => {
		expect(parseServerMessage('')).toBeUndefined();
	});

	it('reads the error field', () => {
		expect(parseServerMessage('{"error":"File is too large"}')).toBe('File is too large');
	});

	it('falls back to the message field', () => {
		expect(parseServerMessage('{"message":"boom"}')).toBe('boom');
	});

	it('returns nothing for a non-JSON body', () => {
		expect(parseServerMessage('<html>413</html>')).toBeUndefined();
	});

	it('returns nothing for a JSON body with no usable message', () => {
		expect(parseServerMessage('{"success":false}')).toBeUndefined();
		expect(parseServerMessage('{"error":""}')).toBeUndefined();
	});
});
