import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getLoginSettings } from '../getSettings';
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

jest.mock('../getUsersPresence', () => ({
	setPresenceCap: jest.fn()
}));

jest.mock('~/lib/store/auxStore', () => ({
	store: { dispatch: jest.fn(), getState: jest.fn() }
}));

jest.mock('../helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const PROBED_SERVER = 'https://probed.example';
const sentToNetwork = jest.fn((_url: string, _options: { headers: Record<string, string> }) =>
	Promise.resolve({ json: () => Promise.resolve({ success: true, settings: [] }) } as Response)
);

const originalGlobalFetch = global.fetch;
const originalCustomHeaders = RocketChatSettings.customHeaders;

beforeEach(() => {
	sentToNetwork.mockClear();
	global.fetch = sentToNetwork as unknown as typeof global.fetch;
	RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
	UserPreferences.removeItem(getBasicAuthKey(PROBED_SERVER));
});

afterEach(() => {
	global.fetch = originalGlobalFetch;
	RocketChatSettings.customHeaders = originalCustomHeaders;
	UserPreferences.removeItem(getBasicAuthKey(PROBED_SERVER));
});

describe('getLoginSettings — per-request basic auth', () => {
	it('sends the requested server its own stored basic auth instead of the active workspace one', async () => {
		UserPreferences.setString(getBasicAuthKey(PROBED_SERVER), 'probed-credentials');

		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '7.0.0' });

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][0]).toContain(`${PROBED_SERVER}/api/v1/settings.public`);
		expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic probed-credentials' });
	});

	it('sends no basic auth at all when the requested server has none stored', async () => {
		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '7.0.0' });

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});

	it('picks the settings URL form from the requested server version', async () => {
		await getLoginSettings({ server: PROBED_SERVER, serverVersion: '6.9.0' });

		expect(sentToNetwork.mock.calls[0][0]).toContain('query={"_id":{"$in"');
	});
});
