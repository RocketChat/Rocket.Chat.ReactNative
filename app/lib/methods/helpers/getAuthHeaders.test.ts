/* eslint-disable import/first */
jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: {
		server: 'https://open.rocket.chat',
		getHeaders: jest.fn()
	}
}));

import { getAuthHeaders } from './getAuthHeaders';
import sdk from '../../services/sdk';

describe('getAuthHeaders', () => {
	beforeEach(() => {
		(sdk.getHeaders as jest.Mock).mockReset();
	});

	it('returns full headers including the session token for same-origin URLs', () => {
		(sdk.getHeaders as jest.Mock).mockReturnValue({ 'User-Agent': 'RC Mobile', 'X-Auth-Token': 'tok', 'X-User-Id': 'uid' });
		const headers = getAuthHeaders('https://open.rocket.chat/api/v1/settings');
		expect(headers['X-Auth-Token']).toBe('tok');
		expect(headers['X-User-Id']).toBe('uid');
		expect(headers['User-Agent']).toBe('RC Mobile');
	});

	it('strips only the session token for cross-origin URLs, keeping other headers', () => {
		(sdk.getHeaders as jest.Mock).mockReturnValue({
			'User-Agent': 'RC Mobile',
			Authorization: 'Basic abc',
			'X-Auth-Token': 'tok',
			'X-User-Id': 'uid'
		});
		const headers = getAuthHeaders('https://releases.rocket.chat/v2/server/supportedVersions');
		expect(headers['X-Auth-Token']).toBeUndefined();
		expect(headers['X-User-Id']).toBeUndefined();
		expect(headers['User-Agent']).toBe('RC Mobile');
		expect(headers.Authorization).toBe('Basic abc');
	});

	it('treats relative URLs as same-origin', () => {
		(sdk.getHeaders as jest.Mock).mockReturnValue({ 'X-Auth-Token': 'tok' });
		const headers = getAuthHeaders('/api/v1/x');
		expect(headers['X-Auth-Token']).toBe('tok');
	});
});
