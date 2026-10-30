import { UploadHttpError } from '../fileUpload/UploadHttpError';
import { parseServerMessage, parseUploadResponse } from '../parseUploadResponse';

const getError = (status: number, body: string, retryAfterSeconds?: number) => {
	try {
		parseUploadResponse(status, body, retryAfterSeconds);
	} catch (error) {
		return error;
	}
	return undefined;
};

describe('parseUploadResponse', () => {
	it('returns the parsed body of a 2xx response', () => {
		expect(parseUploadResponse(200, '{"file":{"_id":"abc"}}')).toEqual({ file: { _id: 'abc' } });
	});

	it('rejects a 2xx response whose body is not JSON', () => {
		expect(() => parseUploadResponse(200, 'not json')).toThrow('Upload failed: invalid server response');
	});

	it('throws an UploadHttpError carrying the status and the server message', () => {
		const error = getError(413, '{"error":"File is too large"}');

		expect(error).toBeInstanceOf(UploadHttpError);
		expect(error).toMatchObject({ status: 413, serverMessage: 'File is too large' });
	});

	it('carries the retry wait on the UploadHttpError', () => {
		expect(getError(429, '{}', 12)).toMatchObject({ status: 429, retryAfterSeconds: 12 });
	});

	it('treats a 3xx as an HTTP error instead of a success', () => {
		expect(getError(302, '<html>Found</html>')).toMatchObject({ name: 'UploadHttpError', status: 302 });
	});
});

describe('parseServerMessage', () => {
	it('returns nothing for an empty body', () => {
		expect(parseServerMessage(undefined)).toBeUndefined();
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
