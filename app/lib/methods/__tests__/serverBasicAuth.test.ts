import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { fetchForWorkspace, getBasicAuthHeaderForUrl, withBasicAuth } from '../serverBasicAuth';
import { headers } from '~/lib/methods/helpers/fetch';
import UserPreferences from '~/lib/methods/userPreferences';
import { getBasicAuthKey } from '~/lib/constants/keys';
import { mockGlobalFetch } from '~/lib/testUtils/mockGlobalFetch';

describe('getBasicAuthHeaderForUrl', () => {
	const server = 'https://open.rocket.chat';

	beforeEach(() => {
		UserPreferences.setString(getBasicAuthKey(server), 'server-credentials');
	});

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(server));
	});

	it('returns the stored basic auth for a url on the same origin as the server', () => {
		expect(getBasicAuthHeaderForUrl(`${server}/sso/api?token=1`, server)).toBe('Basic server-credentials');
	});

	it('treats the default port as the same origin', () => {
		expect(getBasicAuthHeaderForUrl('https://open.rocket.chat:443/sso/api', server)).toBe('Basic server-credentials');
	});

	it('returns undefined for a different host', () => {
		expect(getBasicAuthHeaderForUrl('https://sso.example.com/api', server)).toBeUndefined();
	});

	it('returns undefined for a host that only starts with the server host', () => {
		expect(getBasicAuthHeaderForUrl('https://open.rocket.chat.evil.example/api', server)).toBeUndefined();
	});

	it('returns undefined for the same host over another scheme or port', () => {
		expect(getBasicAuthHeaderForUrl('http://open.rocket.chat/api', server)).toBeUndefined();
		expect(getBasicAuthHeaderForUrl('https://open.rocket.chat:8443/api', server)).toBeUndefined();
	});

	it('returns undefined when the url is not absolute', () => {
		expect(getBasicAuthHeaderForUrl('/sso/api', server)).toBeUndefined();
		expect(getBasicAuthHeaderForUrl('', server)).toBeUndefined();
	});

	it('returns undefined when the server has no stored basic auth', () => {
		UserPreferences.removeItem(getBasicAuthKey(server));

		expect(getBasicAuthHeaderForUrl(`${server}/sso/api`, server)).toBeUndefined();
	});
});

describe('fetchForWorkspace', () => {
	const workspace = 'https://open.rocket.chat';
	const sentToNetwork = mockGlobalFetch(() => Promise.resolve({} as Response));

	beforeEach(() => {
		RocketChatSettings.customHeaders = { ...headers, Authorization: 'Basic active-workspace' };
	});

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(workspace));
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
});

describe('withBasicAuth', () => {
	const workspace = 'https://open.rocket.chat';
	const originalCustomHeaders = RocketChatSettings.customHeaders;
	const activeHeaders = { ...headers, Authorization: 'Basic active-workspace' };

	beforeEach(() => {
		RocketChatSettings.customHeaders = activeHeaders;
		UserPreferences.setString(getBasicAuthKey(workspace), 'workspace-credentials');
	});

	afterEach(() => {
		RocketChatSettings.customHeaders = originalCustomHeaders;
		UserPreferences.removeItem(getBasicAuthKey(workspace));
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
});
