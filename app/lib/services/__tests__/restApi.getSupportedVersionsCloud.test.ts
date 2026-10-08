import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { getSupportedVersionsCloud } from '../restApi';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

describe('getSupportedVersionsCloud', () => {
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({} as Response));

	beforeEach(() => {
		RocketChatSettings.customHeaders = { Authorization: 'Basic current-workspace' };
	});

	it('does not send the current workspace basic auth to the cloud', async () => {
		await getSupportedVersionsCloud('unique-id', 'https://workspace.example');

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][0]).toContain('https://releases.rocket.chat/v2/server/supportedVersions');
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});

	it('passes the abort signal to the request', async () => {
		const controller = new AbortController();

		await getSupportedVersionsCloud('unique-id', 'https://workspace.example', controller.signal);

		expect(sentToNetwork.mock.calls[0][1].signal).toBe(controller.signal);
	});
});
