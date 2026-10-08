import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import fetchWithHeaders, { headers, setSharedAuthorizationOrigin } from '../fetch';

const fetchMock = jest.fn(() => Promise.resolve({} as Response));

const workspace = 'https://open.rocket.chat';

describe('fetch helper', () => {
	beforeEach(() => {
		fetchMock.mockClear();
		global.fetch = fetchMock as unknown as typeof global.fetch;
	});

	afterEach(() => {
		RocketChatSettings.customHeaders = headers;
		setSharedAuthorizationOrigin(null);
	});

	it('drops headers whose value is undefined or null', async () => {
		await fetchWithHeaders('https://open.rocket.chat/api/info', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', 'X-Auth-Token': undefined, 'X-User-Id': null as unknown as undefined }
		});

		expect(fetchMock).toHaveBeenCalledWith('https://open.rocket.chat/api/info', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json', 'User-Agent': headers['User-Agent'] }
		});
	});

	it('keeps headers whose value is defined', async () => {
		await fetchWithHeaders('https://open.rocket.chat/api/info', {
			headers: { 'X-Auth-Token': 'token', 'X-User-Id': 'userId' }
		});

		expect(fetchMock).toHaveBeenCalledWith('https://open.rocket.chat/api/info', {
			headers: { 'X-Auth-Token': 'token', 'X-User-Id': 'userId', 'User-Agent': headers['User-Agent'] }
		});
	});

	describe('shared Authorization', () => {
		beforeEach(() => {
			RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic workspace' };
			setSharedAuthorizationOrigin(workspace);
		});

		it('is sent to the origin it was applied for', async () => {
			await fetchWithHeaders(`${workspace}/api/info`);

			expect(fetchMock).toHaveBeenCalledWith(`${workspace}/api/info`, {
				headers: { Authorization: 'Basic workspace', 'User-Agent': headers['User-Agent'] }
			});
		});

		it.each([
			['another host', 'https://attacker.example/api/info'],
			['a host that only starts with the workspace host', 'https://open.rocket.chat.evil.example/api/info'],
			['the same host over another scheme', 'http://open.rocket.chat/api/info'],
			['the same host on another port', 'https://open.rocket.chat:8443/api/info'],
			['a relative url', '/api/info']
		])('is not sent to %s', async (_, url) => {
			await fetchWithHeaders(url);

			expect(fetchMock).toHaveBeenCalledWith(url, { headers: { 'User-Agent': headers['User-Agent'] } });
		});

		it('is not sent anywhere once the scope is cleared', async () => {
			setSharedAuthorizationOrigin(null);

			await fetchWithHeaders(`${workspace}/api/info`);
			await fetchWithHeaders('/api/info');

			expect(fetchMock).toHaveBeenNthCalledWith(1, `${workspace}/api/info`, { headers: { 'User-Agent': headers['User-Agent'] } });
			expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/info', { headers: { 'User-Agent': headers['User-Agent'] } });
		});

		it("lets the caller's Authorization win", async () => {
			await fetchWithHeaders(`${workspace}/api/info`, {
				headers: { 'Content-Type': 'application/json', Authorization: 'Basic requested' }
			});

			expect(fetchMock).toHaveBeenCalledWith(`${workspace}/api/info`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Basic requested',
					'User-Agent': headers['User-Agent']
				}
			});
		});

		it('is dropped when the caller passes Authorization: undefined', async () => {
			await fetchWithHeaders(`${workspace}/api/info`, {
				headers: { 'Content-Type': 'application/json', Authorization: undefined }
			});

			expect(fetchMock).toHaveBeenCalledWith(`${workspace}/api/info`, {
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': headers['User-Agent']
				}
			});
		});
	});
});
