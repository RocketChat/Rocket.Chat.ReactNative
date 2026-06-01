/* eslint-disable import/first */
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		getHeaders: jest.fn(),
		setBasicAuth: jest.fn()
	}
}));

import customFetch, { setBasicAuth } from './fetch';
import sdk from '../../services/sdk';

const originalFetch = global.fetch;

describe('helpers/fetch', () => {
	let fetchMock: jest.Mock;

	beforeEach(() => {
		fetchMock = jest.fn().mockResolvedValue({ ok: true });
		global.fetch = fetchMock as any;
		(sdk.getHeaders as jest.Mock).mockReset().mockReturnValue({ 'User-Agent': 'RC Mobile' });
		(sdk.setBasicAuth as jest.Mock).mockReset();
	});

	afterAll(() => {
		global.fetch = originalFetch;
	});

	it('includes sdk.getHeaders() in every request', async () => {
		await customFetch('/api/v1/test');
		expect(fetchMock).toHaveBeenCalledWith(
			'/api/v1/test',
			expect.objectContaining({
				headers: expect.objectContaining({ 'User-Agent': 'RC Mobile' })
			})
		);
	});

	it('lets per-request headers override sdk.getHeaders() on conflict', async () => {
		(sdk.getHeaders as jest.Mock).mockReturnValue({ 'X-Custom': 'base' });
		await customFetch('/api/v1/test', { headers: { 'X-Custom': 'override' } as any });
		const call = fetchMock.mock.calls[0][1];
		expect(call.headers['X-Custom']).toBe('override');
	});

	it('forwards method and body options unchanged', async () => {
		await customFetch('/api/v1/test', { method: 'POST', body: '{"a":1}' });
		const call = fetchMock.mock.calls[0][1];
		expect(call.method).toBe('POST');
		expect(call.body).toBe('{"a":1}');
	});

	it('does not mutate the base headers object across multiple calls', async () => {
		const base = { 'X-Base': 'one' };
		(sdk.getHeaders as jest.Mock).mockReturnValue(base);
		await customFetch('/a', { headers: { 'X-Per-Request': 'a' } as any });
		await customFetch('/b', { headers: { 'X-Per-Request': 'b' } as any });
		expect(base).toEqual({ 'X-Base': 'one' });
		expect(fetchMock.mock.calls[0][1].headers['X-Per-Request']).toBe('a');
		expect(fetchMock.mock.calls[1][1].headers['X-Per-Request']).toBe('b');
	});

	it('returns the underlying fetch promise unchanged', async () => {
		const expected = { ok: true, status: 200 };
		fetchMock.mockResolvedValueOnce(expected);
		await expect(customFetch('/api/v1/test')).resolves.toBe(expected);
	});
});

describe('helpers/fetch setBasicAuth', () => {
	it('delegates to sdk.setBasicAuth', () => {
		setBasicAuth('dXNlcjpwYXNz');
		expect(sdk.setBasicAuth).toHaveBeenCalledWith('dXNlcjpwYXNz');
	});

	it('forwards null to clear basic auth', () => {
		setBasicAuth(null);
		expect(sdk.setBasicAuth).toHaveBeenCalledWith(null);
	});
});
