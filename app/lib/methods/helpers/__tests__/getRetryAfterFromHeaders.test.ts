import { getRetryAfterFromHeaders } from '../getRetryAfterFromHeaders';

describe('getRetryAfterFromHeaders', () => {
	it.each([['Retry-After'], ['retry-after'], ['RETRY-AFTER']])('finds the header spelled %s', name => {
		expect(getRetryAfterFromHeaders({ [name]: '12' })).toBe(12);
	});

	it('returns nothing without headers', () => {
		expect(getRetryAfterFromHeaders(undefined)).toBeUndefined();
		expect(getRetryAfterFromHeaders({ 'content-type': 'application/json' })).toBeUndefined();
	});
});
