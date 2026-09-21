import { UploadHttpError, getRetryAfterFromHeaders, parseRetryAfter, parseUploadErrorBody } from './definitions';

describe('parseUploadErrorBody', () => {
	it('returns nothing for an empty body', () => {
		expect(parseUploadErrorBody(undefined)).toEqual({});
		expect(parseUploadErrorBody('')).toEqual({});
	});

	it('reads the error field', () => {
		expect(parseUploadErrorBody('{"error":"File is too large"}')).toEqual({
			serverMessage: 'File is too large',
			body: '{"error":"File is too large"}'
		});
	});

	it('falls back to the message field', () => {
		expect(parseUploadErrorBody('{"message":"boom"}')).toMatchObject({ serverMessage: 'boom' });
	});

	it('keeps a non-JSON body with no server message', () => {
		expect(parseUploadErrorBody('<html>413</html>')).toEqual({ body: '<html>413</html>' });
	});

	it('ignores a JSON body with no usable message', () => {
		expect(parseUploadErrorBody('{"success":false}')).toEqual({ body: '{"success":false}' });
	});

	it('truncates a long body', () => {
		expect(parseUploadErrorBody('x'.repeat(600)).body).toHaveLength(500);
	});
});

describe('parseRetryAfter', () => {
	it.each([
		[undefined, undefined],
		[null, undefined],
		['', undefined],
		['0', undefined],
		['-5', undefined],
		['37', 37],
		['nonsense', undefined]
	])('parses %p as %p', (value, expected) => {
		expect(parseRetryAfter(value)).toBe(expected);
	});

	it('parses an HTTP date into the seconds remaining', () => {
		jest.spyOn(Date, 'now').mockReturnValue(Date.parse('Wed, 21 Oct 2015 07:28:00 GMT'));

		expect(parseRetryAfter('Wed, 21 Oct 2015 07:28:30 GMT')).toBe(30);

		(Date.now as jest.Mock).mockRestore();
	});

	it('ignores an HTTP date already in the past', () => {
		jest.spyOn(Date, 'now').mockReturnValue(Date.parse('Wed, 21 Oct 2015 07:29:00 GMT'));

		expect(parseRetryAfter('Wed, 21 Oct 2015 07:28:00 GMT')).toBeUndefined();

		(Date.now as jest.Mock).mockRestore();
	});
});

describe('getRetryAfterFromHeaders', () => {
	it.each([['Retry-After'], ['retry-after'], ['RETRY-AFTER']])('finds the header spelled %s', name => {
		expect(getRetryAfterFromHeaders({ [name]: '12' })).toBe(12);
	});

	it('returns nothing without headers', () => {
		expect(getRetryAfterFromHeaders(undefined)).toBeUndefined();
		expect(getRetryAfterFromHeaders({ 'content-type': 'application/json' })).toBeUndefined();
	});
});

describe('UploadHttpError', () => {
	it('carries the status in the message so crash reports group by it', () => {
		expect(new UploadHttpError(413).message).toBe('Error: 413');
		expect(new UploadHttpError(429).message).toBe('Error: 429');
	});

	it('leaves optional details unset when absent', () => {
		const error = new UploadHttpError(500);

		expect(error.serverMessage).toBeUndefined();
		expect(error.body).toBeUndefined();
		expect(error.retryAfterSeconds).toBeUndefined();
	});
});
