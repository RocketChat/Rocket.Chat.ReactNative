import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getSupportedVersionsCloud } from '../restApi';

describe('getSupportedVersionsCloud', () => {
	const originalGlobalFetch = global.fetch;
	const originalCustomHeaders = RocketChatSettings.customHeaders;
	const sentToNetwork = jest.fn((_url: string, _options: { headers: Record<string, string> }) => Promise.resolve({} as Response));

	beforeEach(() => {
		sentToNetwork.mockClear();
		global.fetch = sentToNetwork as unknown as typeof global.fetch;
		RocketChatSettings.customHeaders = { Authorization: 'Basic current-workspace' };
	});

	afterEach(() => {
		global.fetch = originalGlobalFetch;
		RocketChatSettings.customHeaders = originalCustomHeaders;
	});

	it('does not send the current workspace basic auth to the cloud', async () => {
		await getSupportedVersionsCloud('unique-id', 'https://workspace.example');

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][0]).toContain('https://releases.rocket.chat/v2/server/supportedVersions');
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});
});
