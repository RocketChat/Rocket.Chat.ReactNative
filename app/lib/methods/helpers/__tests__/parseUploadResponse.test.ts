import { parseUploadResponse } from '../parseUploadResponse';

describe('parseUploadResponse', () => {
	it('returns the parsed body of a 2xx response', () => {
		expect(parseUploadResponse(200, '{"file":{"_id":"abc"}}')).toEqual({ file: { _id: 'abc' } });
	});

	it('rejects a 2xx response whose body is not JSON', () => {
		expect(() => parseUploadResponse(200, 'not json')).toThrow('Upload failed: invalid server response');
	});

	it('passes the Retry-After header of a failed response on to the error', () => {
		expect(() => parseUploadResponse(429, '{}', '12')).toThrow(expect.objectContaining({ retryAfterSeconds: 12 }));
	});
});
