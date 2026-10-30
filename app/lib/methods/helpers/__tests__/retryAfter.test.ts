import { getRetryAfterFromHeaders, parseRetryAfter, parseRetryAfterFromMessage } from '../retryAfter';

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

describe('parseRetryAfterFromMessage', () => {
	it('reads the wait from the rate limit message', () => {
		expect(
			parseRetryAfterFromMessage(
				'Error, too many requests. Please slow down. You must wait 42 seconds before trying this endpoint again. [error-too-many-requests]'
			)
		).toBe(42);
	});

	it.each([[undefined], [''], ['Too many requests'], ['You must wait 0 seconds']])('returns nothing for %p', message => {
		expect(parseRetryAfterFromMessage(message)).toBeUndefined();
	});

	it('reads the wait regardless of casing', () => {
		expect(parseRetryAfterFromMessage('You must Wait 15 Seconds before trying again.')).toBe(15);
	});
});
