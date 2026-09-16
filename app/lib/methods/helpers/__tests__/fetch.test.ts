import fetchWithHeaders, { headers } from '../fetch';

describe('fetch helper', () => {
	const globalFetch = jest.fn().mockResolvedValue({} as Response);

	beforeEach(() => {
		globalFetch.mockClear();
		globalThis.fetch = globalFetch;
	});

	it('drops headers whose value is undefined or null', async () => {
		await fetchWithHeaders('https://example.com/api/info', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', 'X-Auth-Token': undefined, 'X-User-Id': null as unknown as undefined }
		});

		const [, options] = globalFetch.mock.calls[0];
		expect(options.headers).toEqual({ 'Content-Type': 'application/json', ...headers });
	});

	it('keeps defined caller headers alongside the default ones', async () => {
		await fetchWithHeaders('https://example.com/api/info', {
			headers: { 'X-Auth-Token': 'token', 'X-User-Id': 'id' }
		});

		const [, options] = globalFetch.mock.calls[0];
		expect(options.headers).toEqual({ 'X-Auth-Token': 'token', 'X-User-Id': 'id', ...headers });
	});
});
