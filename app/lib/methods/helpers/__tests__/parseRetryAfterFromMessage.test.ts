import { parseRetryAfterFromMessage } from '../parseRetryAfterFromMessage';

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
