import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { applyBasicAuth, fetchForWorkspace, withBasicAuth } from '../serverBasicAuth';
import fetchWithHeaders, { headers, setSharedAuthorizationOrigin } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

describe('applyBasicAuth', () => {
	const workspace = 'https://open.rocket.chat';
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({} as Response));

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(workspace));
		setSharedAuthorizationOrigin(null);
	});

	it('shares the stored basic auth only with the workspace it was applied for', async () => {
		UserPreferences.setString(getBasicAuthKey(workspace), 'workspace-credentials');
		applyBasicAuth(workspace);

		await fetchWithHeaders(`${workspace}/api/info`);
		await fetchWithHeaders('https://other.example/api/info');

		expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic workspace-credentials' });
		expect(sentToNetwork.mock.calls[1][1].headers).not.toHaveProperty('Authorization');
	});
});

describe('fetchForWorkspace', () => {
	const workspace = 'https://open.rocket.chat';
	const workspaceWithoutScheme = 'open.rocket.chat';
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({} as Response));

	beforeEach(() => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
		setSharedAuthorizationOrigin(workspace);
	});

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(workspace));
		UserPreferences.removeItem(getBasicAuthKey(workspaceWithoutScheme));
		setSharedAuthorizationOrigin(null);
	});

	it('sends the stored basic auth of the workspace instead of the shared one', async () => {
		UserPreferences.setString(getBasicAuthKey(workspace), 'workspace-credentials');

		await fetchForWorkspace(workspace, `${workspace}/api/info`);

		expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic workspace-credentials' });
	});

	it('sends no basic auth when the workspace has none stored', async () => {
		await fetchForWorkspace(workspace, `${workspace}/api/info`);

		expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
	});

	it('keeps the method, headers and signal of the caller', async () => {
		const controller = new AbortController();

		await fetchForWorkspace(workspace, `${workspace}/api/info`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			signal: controller.signal
		});

		expect(sentToNetwork.mock.calls[0][1]).toMatchObject({
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			signal: controller.signal
		});
	});

	describe('origin scoping', () => {
		beforeEach(() => {
			UserPreferences.setString(getBasicAuthKey(workspace), 'workspace-credentials');
		});

		it('treats the default port as the same origin', async () => {
			await fetchForWorkspace(workspace, 'https://open.rocket.chat:443/sso/api');

			expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic workspace-credentials' });
		});

		it.each([
			['a different host', 'https://sso.example.com/api'],
			['a host that only starts with the workspace host', 'https://open.rocket.chat.evil.example/api'],
			['the same host over another scheme', 'http://open.rocket.chat/api'],
			['the same host on another port', 'https://open.rocket.chat:8443/api'],
			['a relative url', '/sso/api'],
			['an empty url', '']
		])('sends no basic auth to %s', async (_, url) => {
			await fetchForWorkspace(workspace, url);

			expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
		});

		it('sends no basic auth when neither the url nor the workspace has a valid origin', async () => {
			UserPreferences.setString(getBasicAuthKey(workspaceWithoutScheme), 'workspace-credentials');

			await fetchForWorkspace(workspaceWithoutScheme, '/sso/api');

			expect(sentToNetwork.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
		});
	});
});

describe('withBasicAuth', () => {
	const workspace = 'https://open.rocket.chat';
	const activeWorkspace = 'https://active.rocket.chat';
	const originalCustomHeaders = RocketChatSettings.customHeaders;
	const activeHeaders = { ...headers, Authorization: 'Basic active-workspace' };
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({} as Response));

	beforeEach(() => {
		RocketChatSettings.customHeaders = activeHeaders;
		UserPreferences.setString(getBasicAuthKey(workspace), 'workspace-credentials');
	});

	afterEach(() => {
		RocketChatSettings.customHeaders = originalCustomHeaders;
		UserPreferences.removeItem(getBasicAuthKey(workspace));
		UserPreferences.removeItem(getBasicAuthKey(activeWorkspace));
		setSharedAuthorizationOrigin(null);
	});

	it('points the shared headers at the workspace while running and hands the previous ones back', () => {
		let headersWhileRunning: typeof RocketChatSettings.customHeaders;

		withBasicAuth(workspace, () => {
			headersWhileRunning = RocketChatSettings.customHeaders;
		});

		expect(headersWhileRunning!).toMatchObject({ Authorization: 'Basic workspace-credentials' });
		expect(RocketChatSettings.customHeaders).toBe(activeHeaders);
	});

	it('hands the previous headers back when the callback throws', () => {
		expect(() =>
			withBasicAuth(workspace, () => {
				throw new Error('boom');
			})
		).toThrow('boom');

		expect(RocketChatSettings.customHeaders).toBe(activeHeaders);
	});

	it('returns what the callback returns', () => {
		expect(withBasicAuth(workspace, () => 42)).toBe(42);
	});

	it('keeps the shared basic auth scoped to the active workspace', async () => {
		UserPreferences.setString(getBasicAuthKey(activeWorkspace), 'active-credentials');
		applyBasicAuth(activeWorkspace);

		withBasicAuth(workspace, () => undefined);
		await fetchWithHeaders(`${activeWorkspace}/api/info`);
		await fetchWithHeaders(`${workspace}/api/info`);

		expect(sentToNetwork.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Basic active-credentials' });
		expect(sentToNetwork.mock.calls[1][1].headers).not.toHaveProperty('Authorization');
	});
});
