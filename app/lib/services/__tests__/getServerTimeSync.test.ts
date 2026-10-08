import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getServerTimeSync } from '../getServerTimeSync';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

describe('getServerTimeSync', () => {
	const requested = 'https://requested.example';
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({ json: () => Promise.resolve('1700000000000') } as Response));

	beforeEach(() => {
		jest.useFakeTimers();
		RocketChatSettings.customHeaders = { Authorization: 'Basic current-workspace' };
	});

	afterEach(() => {
		jest.useRealTimers();
		UserPreferences.removeItem(getBasicAuthKey(requested));
	});

	it('does not send the current workspace basic auth to the requested server', async () => {
		await getServerTimeSync(requested);

		expect(sentToNetwork.mock.calls[0][0]).toBe(`${requested}/_timesync`);
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});

	it('sends the basic auth stored for the requested server', async () => {
		UserPreferences.setString(getBasicAuthKey(requested), 'requested-workspace');

		await getServerTimeSync(requested);

		expect(sentToNetwork.mock.calls[0][1].headers.Authorization).toBe('Basic requested-workspace');
	});

	it('returns the parsed server time', async () => {
		await expect(getServerTimeSync(requested)).resolves.toBe(1700000000000);
	});
});
