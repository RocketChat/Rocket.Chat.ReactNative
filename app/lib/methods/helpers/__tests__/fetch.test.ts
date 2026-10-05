import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import fetchWithHeaders, { headers } from '../fetch';

jest.mock('react-native-device-info', () => ({
	getSystemVersion: () => '14',
	getVersion: () => '4.0.0',
	getBuildNumber: () => '1'
}));

const fetchMock = jest.fn(() => Promise.resolve({} as Response));

describe('fetch helper', () => {
	beforeEach(() => {
		fetchMock.mockClear();
		global.fetch = fetchMock as unknown as typeof global.fetch;
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

	it('excludes global basic auth when skipCustomHeaders is true', async () => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic victim' };

		await fetchWithHeaders('https://attacker.example/api/info', {
			headers: { 'Content-Type': 'application/json', Authorization: 'Basic requested' },
			skipCustomHeaders: true
		});

		expect(fetchMock).toHaveBeenCalledWith('https://attacker.example/api/info', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Basic requested',
				'User-Agent': headers['User-Agent']
			}
		});

		RocketChatSettings.customHeaders = headers;
	});
});
