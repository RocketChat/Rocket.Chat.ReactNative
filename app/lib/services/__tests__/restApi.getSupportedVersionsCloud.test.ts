import { getSupportedVersionsCloud } from '../restApi';
import { applyBasicAuth } from '~/lib/methods/serverBasicAuth';
import { setSharedAuthorizationOrigin } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

describe('getSupportedVersionsCloud', () => {
	const workspace = 'https://workspace.example';
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({} as Response));

	beforeEach(() => {
		UserPreferences.setString(getBasicAuthKey(workspace), 'current-workspace');
		applyBasicAuth(workspace);
	});

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(workspace));
		setSharedAuthorizationOrigin(null);
	});

	it('does not send the current workspace basic auth to the cloud', async () => {
		await getSupportedVersionsCloud('unique-id', workspace);

		expect(sentToNetwork).toHaveBeenCalledTimes(1);
		expect(sentToNetwork.mock.calls[0][0]).toContain('https://releases.rocket.chat/v2/server/supportedVersions');
		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});

	it('passes the abort signal to the request', async () => {
		const controller = new AbortController();

		await getSupportedVersionsCloud('unique-id', workspace, controller.signal);

		expect(sentToNetwork.mock.calls[0][1].signal).toBe(controller.signal);
	});
});
