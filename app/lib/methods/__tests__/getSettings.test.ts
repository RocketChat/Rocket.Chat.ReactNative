import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getSettings } from '../getSettings';
import { headers } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() }, servers: { get: jest.fn(), write: jest.fn() } }
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {}
}));

jest.mock('~/lib/methods/getUsersPresence', () => ({
	setPresenceCap: jest.fn()
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn(() => ({ server: { version: '7.0.0' } })) }
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const SERVER = 'https://settings.example';
const OTHER_WORKSPACE_AUTH = 'Basic other-workspace';

const firstPage = { success: true, settings: [{ _id: 'Site_Name' }], total: 2 };
const failedPage = { success: false };

const sentToNetwork = jest.fn((_url: string, _options: { headers: Record<string, string> }) => {
	const isFirstPage = sentToNetwork.mock.calls.length === 1;
	if (isFirstPage) {
		RocketChatSettings.customHeaders = { ...headers, Authorization: OTHER_WORKSPACE_AUTH };
	}
	return Promise.resolve({ json: () => Promise.resolve(isFirstPage ? firstPage : failedPage) } as Response);
});

const originalGlobalFetch = global.fetch;
const originalCustomHeaders = RocketChatSettings.customHeaders;

beforeEach(() => {
	sentToNetwork.mockClear();
	global.fetch = sentToNetwork as unknown as typeof global.fetch;
	RocketChatSettings.customHeaders = headers;
	UserPreferences.removeItem(getBasicAuthKey(SERVER));
});

afterEach(() => {
	global.fetch = originalGlobalFetch;
	RocketChatSettings.customHeaders = originalCustomHeaders;
	UserPreferences.removeItem(getBasicAuthKey(SERVER));
});

describe('getSettings — per-page basic auth', () => {
	it('keeps sending the requested server its own basic auth on later pages after another workspace takes over the shared headers', async () => {
		UserPreferences.setString(getBasicAuthKey(SERVER), 'server-credentials');

		await getSettings(SERVER);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		expect(sentToNetwork.mock.calls[0][0]).toContain('&offset=0');
		expect(sentToNetwork.mock.calls[1][0]).toContain('&offset=1');
		sentToNetwork.mock.calls.forEach(([, options]) => {
			expect(options.headers).toMatchObject({ Authorization: 'Basic server-credentials' });
		});
	});

	it('never sends another workspace basic auth to a server that has none stored', async () => {
		await getSettings(SERVER);

		expect(sentToNetwork).toHaveBeenCalledTimes(2);
		sentToNetwork.mock.calls.forEach(([, options]) => {
			expect(options.headers).not.toHaveProperty('Authorization');
		});
	});
});
