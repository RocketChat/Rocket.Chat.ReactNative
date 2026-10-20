import { isTransientSendError } from '../isTransientSendError';

describe('isTransientSendError', () => {
	it.each([
		['a network failure', new TypeError('Network request failed')],
		['a plain error', new Error('boom')],
		['a rejection without a value', undefined],
		['a null rejection', null],
		['a server error', { status: 500, data: { success: false } }],
		['a bad gateway', { status: 502 }],
		['the last server error status', { status: 599 }],
		['a rate limit', { status: 429 }]
	])('retries %s', (_, error) => {
		expect(isTransientSendError(error)).toBe(true);
	});

	it.each([
		['a bad request', { status: 400 }],
		['an unauthorized request', { status: 401 }],
		['a forbidden request', { status: 403 }],
		['a missing resource', { status: 404 }],
		['the last client error status', { status: 499 }]
	])('does not retry %s', (_, error) => {
		expect(isTransientSendError(error)).toBe(false);
	});
});
