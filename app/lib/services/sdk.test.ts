/* eslint-disable import/first */
jest.mock('./twoFactor', () => ({
	twoFactor: jest.fn()
}));

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			settings: { API_Use_REST_For_DDP_Calls: false },
			login: { user: { id: 'u1', token: 't1' } },
			server: { version: '6.0.0' }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn(),
		setString: jest.fn(),
		removeItem: jest.fn()
	}
}));

jest.mock('../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('@rocket.chat/ddp-client', () => ({
	DDPSDK: {
		create: jest.fn(),
		createAndConnect: jest.fn()
	}
}));

import { DDPSDK } from '@rocket.chat/ddp-client';

import sdk, { NOTIFY_USER_EVENTS, normalizeResponseError } from './sdk';
import { twoFactor } from './twoFactor';
import { store as reduxStore } from '../store/auxStore';
import UserPreferences from '../methods/userPreferences';

const setInternalSdk = (value: any) => {
	(sdk as unknown as { sdk: any }).sdk = value;
};

const buildFakeConnection = (overrides: Partial<{ probe: jest.Mock; reopenNow: jest.Mock; close: jest.Mock }> = {}) => ({
	probe: jest.fn().mockResolvedValue(true),
	reopenNow: jest.fn().mockResolvedValue(undefined),
	close: jest.fn(),
	...overrides
});

beforeEach(() => {
	(twoFactor as jest.Mock).mockReset();
	(reduxStore.getState as jest.Mock).mockReset().mockReturnValue({
		settings: { API_Use_REST_For_DDP_Calls: false },
		login: { user: { id: 'u1', token: 't1' } },
		server: { version: '6.0.0' }
	});
	(UserPreferences.getString as jest.Mock).mockReset();
	(UserPreferences.setString as jest.Mock).mockReset();
	(UserPreferences.removeItem as jest.Mock).mockReset();
	(DDPSDK.create as jest.Mock).mockReset();
	(DDPSDK.createAndConnect as jest.Mock).mockReset();
	(sdk as any).serverUrl = undefined;
});

afterEach(() => {
	setInternalSdk(undefined);
	jest.useRealTimers();
});

describe('Sdk.probe', () => {
	it('returns false when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		await expect(sdk.probe()).resolves.toBe(false);
	});

	it('delegates to connection.probe() and forwards the timeout', async () => {
		const connection = buildFakeConnection();
		setInternalSdk({ connection });
		await expect(sdk.probe(1500)).resolves.toBe(true);
		expect(connection.probe).toHaveBeenCalledWith(1500);
	});

	it('returns the result from connection.probe()', async () => {
		const connection = buildFakeConnection({ probe: jest.fn().mockResolvedValue(false) });
		setInternalSdk({ connection });
		await expect(sdk.probe()).resolves.toBe(false);
	});
});

describe('Sdk.reopenNow', () => {
	it('resolves when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		await expect(sdk.reopenNow()).resolves.toBeUndefined();
	});

	it('delegates to connection.reopenNow()', async () => {
		const connection = buildFakeConnection();
		setInternalSdk({ connection });
		await expect(sdk.reopenNow()).resolves.toBeUndefined();
		expect(connection.reopenNow).toHaveBeenCalledTimes(1);
	});
});

describe('Sdk.subscribeNotifyUser', () => {
	const buildFakeSdkWithSubscribe = (user: { id: string } | undefined) => {
		const subscribe = jest.fn((_name: string, _key: string) => ({ id: `sub-${_key}`, stop: jest.fn() }));
		return {
			client: { subscribe },
			account: { user },
			__subscribe: subscribe
		};
	};

	it('returns [] when sdk.current is undefined', () => {
		setInternalSdk(undefined);
		expect(sdk.subscribeNotifyUser()).toEqual([]);
	});

	it('returns [] when no logged-in user and no userId arg', () => {
		setInternalSdk(buildFakeSdkWithSubscribe(undefined));
		expect(sdk.subscribeNotifyUser()).toEqual([]);
	});

	it('subscribes to all 10 user-notify events using the logged-in user id', () => {
		const fake = buildFakeSdkWithSubscribe({ id: 'user-42' });
		setInternalSdk(fake);
		const handles = sdk.subscribeNotifyUser();
		expect(handles).toHaveLength(NOTIFY_USER_EVENTS.length);
		NOTIFY_USER_EVENTS.forEach(event => {
			expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-user', `user-42/${event}`);
		});
	});

	it('includes the patched media-signal and media-calls events', () => {
		const fake = buildFakeSdkWithSubscribe({ id: 'user-42' });
		setInternalSdk(fake);
		sdk.subscribeNotifyUser();
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-user', 'user-42/media-signal');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-user', 'user-42/media-calls');
	});

	it('prefers the explicit userId argument over the logged-in user id', () => {
		const fake = buildFakeSdkWithSubscribe({ id: 'logged-in-user' });
		setInternalSdk(fake);
		sdk.subscribeNotifyUser('override-user');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-user', 'override-user/message');
		expect(fake.__subscribe).not.toHaveBeenCalledWith('stream-notify-user', 'logged-in-user/message');
	});

	it('uses the explicit userId even when no user is logged in', () => {
		// Guards the reconnect/reopenNow timing gap: callers pass userId explicitly
		// so subscriptions are established even before account.user is re-populated.
		const fake = buildFakeSdkWithSubscribe(undefined);
		setInternalSdk(fake);
		const handles = sdk.subscribeNotifyUser('explicit-user');
		expect(handles).toHaveLength(NOTIFY_USER_EVENTS.length);
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-user', 'explicit-user/message');
	});
});

describe('Sdk.login', () => {
	const buildFakeSdkWithLogin = (
		postResult: any,
		loginWithToken = jest.fn().mockResolvedValue(undefined),
		logout = jest.fn().mockResolvedValue(undefined)
	) => {
		const post = jest.fn().mockResolvedValue(postResult);
		return {
			client: { ddp: {} },
			connection: buildFakeConnection(),
			account: { loginWithToken, logout },
			rest: { post, handleTwoFactorChallenge: jest.fn() },
			__post: post,
			__loginWithToken: loginWithToken
		};
	};

	it('rejects when sdk is not initialized', async () => {
		setInternalSdk(undefined);
		await expect(sdk.login({ user: 'test', password: 'test' })).rejects.toThrow();
	});

	it('calls loginWithToken with the authToken from the REST response', async () => {
		const fake = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-abc', userId: 'uid-1', me: { username: 'john' } }
		});
		setInternalSdk(fake);
		const result = await sdk.login({ user: 'john', password: 'secret' });
		expect(fake.__loginWithToken).toHaveBeenCalledWith('tok-abc');
		expect(result.authToken).toBe('tok-abc');
	});

	it('rejects when the REST response has status: error', async () => {
		const fake = buildFakeSdkWithLogin({ status: 'error' });
		setInternalSdk(fake);
		await expect(sdk.login({ user: 'john', password: 'wrong' })).rejects.toThrow('Invalid response from server');
	});

	it('rejects and normalizes a raw fetch Response error', async () => {
		const fake = buildFakeSdkWithLogin(null);
		fake.__post.mockRejectedValue(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
		setInternalSdk(fake);
		const err: any = await sdk.login({ user: 'john', password: 'bad' }).catch(e => e);
		expect(err.status).toBe(401);
		expect(err.data.error).toBe('Unauthorized');
	});

	it('sets X-Auth-Token and X-User-Id in getHeaders after successful login', async () => {
		const fake = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-abc', userId: 'uid-1', me: { username: 'john' } }
		});
		setInternalSdk(fake);
		await sdk.login({ user: 'john', password: 'secret' });
		const headers = sdk.getHeaders();
		expect(headers['X-Auth-Token']).toBe('tok-abc');
		expect(headers['X-User-Id']).toBe('uid-1');
	});

	it('clears X-Auth-Token and X-User-Id from getHeaders after logout', async () => {
		const fake = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-abc', userId: 'uid-1', me: { username: 'john' } }
		});
		setInternalSdk(fake);
		await sdk.login({ user: 'john', password: 'secret' });
		await sdk.logout();
		const headers = sdk.getHeaders();
		expect(headers).not.toHaveProperty('X-Auth-Token');
		expect(headers).not.toHaveProperty('X-User-Id');
	});

	it('sets the auth headers from a resume-token (deep link) login response', async () => {
		// Deep link logins reach sdk.login with `{ resume }` instead of `{ user, password }`,
		// but the header centralization reads authToken/userId from the same /v1/login response.
		const fake = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-deep', userId: 'uid-deep', me: { username: 'jane' } }
		});
		setInternalSdk(fake);
		await sdk.login({ resume: 'resume-token-xyz' });
		expect(fake.__post).toHaveBeenCalledWith(
			'/v1/login',
			{ resume: 'resume-token-xyz' },
			expect.objectContaining({ headers: expect.any(Object) })
		);
		const headers = sdk.getHeaders();
		expect(headers['X-Auth-Token']).toBe('tok-deep');
		expect(headers['X-User-Id']).toBe('uid-deep');
	});

	it('uses each server own token/user after switching servers', async () => {
		// Switching servers goes through initialize(), which resets headers to defaults.
		// Login on server1 → token1/user1; re-initialize for server2 → headers cleared;
		// login on server2 → token2/user2 (server1 credentials never leak).
		const server1Sdk = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-1', userId: 'uid-1', me: { username: 'user1' } }
		});
		(DDPSDK.create as jest.Mock).mockReturnValueOnce(server1Sdk);
		sdk.initialize('https://server1.com');
		await sdk.login({ user: 'user1', password: 'pass1' });
		expect(sdk.getHeaders()['X-Auth-Token']).toBe('tok-1');
		expect(sdk.getHeaders()['X-User-Id']).toBe('uid-1');

		const server2Sdk = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-2', userId: 'uid-2', me: { username: 'user2' } }
		});
		(DDPSDK.create as jest.Mock).mockReturnValueOnce(server2Sdk);
		sdk.initialize('https://server2.com');
		// initialize() must wipe server1 credentials before the new login.
		expect(sdk.getHeaders()['X-Auth-Token']).toBeUndefined();
		expect(sdk.getHeaders()['X-User-Id']).toBeUndefined();

		await sdk.login({ user: 'user2', password: 'pass2' });
		expect(sdk.getHeaders()['X-Auth-Token']).toBe('tok-2');
		expect(sdk.getHeaders()['X-User-Id']).toBe('uid-2');
	});

	it('does not write stale headers if the server switches while loginWithToken() is still in flight', async () => {
		let resolveLoginWithToken: () => void = () => {};
		const loginWithToken = jest.fn(
			() =>
				new Promise<void>(resolve => {
					resolveLoginWithToken = resolve;
				})
		);
		const server1Sdk = buildFakeSdkWithLogin(
			{ status: 'success', data: { authToken: 'tok-1', userId: 'uid-1', me: { username: 'user1' } } },
			loginWithToken
		);
		(DDPSDK.create as jest.Mock).mockReturnValueOnce(server1Sdk);
		sdk.initialize('https://server1.com');

		// server1's login suspends inside the loginWithToken() await.
		const loginPromise = sdk.login({ user: 'user1', password: 'pass1' });

		// The app switches to server2 while server1's login is still in flight.
		const server2Sdk = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-2', userId: 'uid-2', me: { username: 'user2' } }
		});
		(DDPSDK.create as jest.Mock).mockReturnValueOnce(server2Sdk);
		sdk.initialize('https://server2.com');
		await sdk.login({ user: 'user2', password: 'pass2' });
		expect(sdk.getHeaders()['X-Auth-Token']).toBe('tok-2');

		// server1's suspended login now resumes — it must reject, not clobber server2's headers.
		resolveLoginWithToken();
		await expect(loginPromise).rejects.toThrow('Server switched during login');
		expect(sdk.getHeaders()['X-Auth-Token']).toBe('tok-2');
		expect(sdk.getHeaders()['X-User-Id']).toBe('uid-2');
	});

	it('switches to the deep link server credentials when already logged in on another server', async () => {
		// Already authenticated on server1.
		const server1Sdk = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-1', userId: 'uid-1', me: { username: 'user1' } }
		});
		(DDPSDK.create as jest.Mock).mockReturnValueOnce(server1Sdk);
		sdk.initialize('https://server1.com');
		await sdk.login({ user: 'user1', password: 'pass1' });
		expect(sdk.getHeaders()['X-Auth-Token']).toBe('tok-1');

		// A deep link targeting server2 re-initializes on the new host, then logs in with the resume token.
		const server2Sdk = buildFakeSdkWithLogin({
			status: 'success',
			data: { authToken: 'tok-2', userId: 'uid-2', me: { username: 'user2' } }
		});
		(DDPSDK.create as jest.Mock).mockReturnValueOnce(server2Sdk);
		sdk.initialize('https://server2.com');
		await sdk.login({ resume: 'deeplink-resume-token' });

		const headers = sdk.getHeaders();
		expect(headers['X-Auth-Token']).toBe('tok-2');
		expect(headers['X-User-Id']).toBe('uid-2');
		// server1 credentials must not survive the deep link switch.
		expect(headers['X-Auth-Token']).not.toBe('tok-1');
		expect(headers['X-User-Id']).not.toBe('uid-1');
	});
});

describe('Sdk.logout', () => {
	it('logs when the account.logout() call times out instead of completing', async () => {
		jest.useFakeTimers();
		const log = jest.requireMock('../methods/helpers/log').default;
		const fake = { account: { logout: jest.fn(() => new Promise(() => {})) } }; // never resolves
		setInternalSdk(fake);

		const logoutPromise = sdk.logout();
		jest.advanceTimersByTime(5000);
		await logoutPromise;

		expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('timed out') }));
		jest.useRealTimers();
	});

	it('still clears auth headers when account.logout() throws', async () => {
		const log = jest.requireMock('../methods/helpers/log').default;
		const fake = { account: { logout: jest.fn().mockRejectedValue(new Error('socket closed')) } };
		setInternalSdk(fake);
		(sdk as any).headers = { ...(sdk as any).headers, 'X-Auth-Token': 'tok-abc', 'X-User-Id': 'uid-1' };

		await sdk.logout();

		expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: 'socket closed' }));
		const headers = sdk.getHeaders();
		expect(headers).not.toHaveProperty('X-Auth-Token');
		expect(headers).not.toHaveProperty('X-User-Id');
	});
});

describe('normalizeResponseError', () => {
	it('parses a JSON body and returns { status, data }', async () => {
		const response = new Response(JSON.stringify({ error: 'not-found' }), { status: 404 });
		const result = await normalizeResponseError(response);
		expect(result).toEqual({ status: 404, data: { error: 'not-found' } });
	});

	it('returns { status, data: {} } when the body is not valid JSON', async () => {
		const response = new Response('plain text error', { status: 500 });
		const result = await normalizeResponseError(response);
		expect(result).toEqual({ status: 500, data: {} });
	});

	it('does not consume the original response (uses clone)', async () => {
		const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
		await normalizeResponseError(response);
		const bodyStillReadable = await response.text();
		expect(bodyStillReadable).toBe(JSON.stringify({ ok: true }));
	});
});

const buildFakeSdkWithRest = (overrides: any = {}) => ({
	client: { ddp: {}, ...(overrides.client || {}) },
	connection: buildFakeConnection(overrides.connection),
	account: overrides.account || { user: { id: 'u1', token: 't1' } },
	rest: {
		get: jest.fn(),
		post: jest.fn(),
		delete: jest.fn(),
		handleTwoFactorChallenge: jest.fn(),
		...(overrides.rest || {})
	}
});

describe('Sdk.post', () => {
	it('posts to a REST endpoint and returns the result', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockResolvedValue({ success: true, data: { id: 'abc' } });
		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/channels.create', { name: 'test' });
		expect(fake.rest.post).toHaveBeenCalledWith(
			'/v1/channels.create',
			{ name: 'test' },
			expect.objectContaining({ headers: expect.any(Object) })
		);
		expect(result).toEqual({ success: true, data: { id: 'abc' } });
	});

	it('normalizes a fetch Response error to { status, data }', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockRejectedValue(new Response(JSON.stringify({ error: 'bad' }), { status: 400 }));
		setInternalSdk(fake);
		await expect((sdk as any).post('/v1/channels.create', {})).rejects.toEqual({ status: 400, data: { error: 'bad' } });
	});

	it('rethrows non-Response errors as-is', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockRejectedValue(new Error('network'));
		setInternalSdk(fake);
		await expect((sdk as any).post('/v1/channels.create', {})).rejects.toThrow('network');
	});

	it('unwraps result.message for /v1/method.call endpoints (Fix 1 regression)', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockResolvedValue({ message: JSON.stringify({ msg: 'result', result: { ok: true } }) });
		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/method.call/someMethod', { message: '{}' });
		expect(result).toEqual({ ok: true });
	});

	it('unwraps result.message for /v1/method.callAnon endpoints', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockResolvedValue({ message: JSON.stringify({ msg: 'result', result: 'anon-ok' }) });
		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/method.callAnon/someMethod', { message: '{}' });
		expect(result).toBe('anon-ok');
	});

	it('throws the inner error from method-call responses', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockResolvedValue({
			message: JSON.stringify({ msg: 'result', error: { error: 'app-error', details: {} } })
		});
		setInternalSdk(fake);
		await expect((sdk as any).post('/v1/method.call/myMethod', { message: '{}' })).rejects.toEqual({
			error: 'app-error',
			details: {}
		});
	});

	it('retries with 2FA when method call returns totp-required', async () => {
		const fake = buildFakeSdkWithRest();
		const err = { message: JSON.stringify({ msg: 'result', error: { error: 'totp-required', details: { method: 'totp' } } }) };
		const ok = { message: JSON.stringify({ msg: 'result', result: { ok: true } }) };
		fake.rest.post.mockResolvedValueOnce(err).mockResolvedValueOnce(ok);
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '123456', twoFactorMethod: 'totp' });
		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/method.call/myMethod', { message: '{}' });
		expect(fake.rest.post).toHaveBeenCalledTimes(2);
		expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false });
		expect(result).toEqual({ ok: true });
	});

	it('returns {} when 2FA is cancelled during method-call retry', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post.mockResolvedValue({
			message: JSON.stringify({ msg: 'result', error: { error: 'totp-required', details: { method: 'totp' } } })
		});
		(twoFactor as jest.Mock).mockRejectedValue(new Error('cancelled'));
		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/method.call/myMethod', { message: '{}' });
		expect(result).toEqual({});
	});

	it('retries with 2FA when normal API returns totp-required', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post
			.mockRejectedValueOnce(
				new Response(JSON.stringify({ errorType: 'totp-required', details: { method: 'totp' } }), { status: 401 })
			)
			.mockResolvedValueOnce({ success: true });
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '999888', twoFactorMethod: 'totp' });

		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/channels.create', { name: 'test' });

		expect(fake.rest.post).toHaveBeenCalledTimes(2);
		expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false });
		expect(result).toEqual({ success: true });
	});

	it('passes invalid:true to twoFactor when normal API returns totp-invalid', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post
			.mockRejectedValueOnce(
				new Response(JSON.stringify({ errorType: 'totp-invalid', details: { method: 'email' } }), { status: 401 })
			)
			.mockResolvedValueOnce({ success: true });
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '111222', twoFactorMethod: 'email' });

		setInternalSdk(fake);
		await (sdk as any).post('/v1/channels.create', { name: 'test' });

		expect(twoFactor).toHaveBeenCalledWith({ method: 'email', invalid: true });
		expect(fake.rest.post).toHaveBeenCalledTimes(2);
	});

	it('prompts twoFactor twice when first code is wrong and retries a third time', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.post
			.mockRejectedValueOnce(
				new Response(JSON.stringify({ errorType: 'totp-required', details: { method: 'totp' } }), { status: 401 })
			)
			.mockRejectedValueOnce(
				new Response(JSON.stringify({ errorType: 'totp-invalid', details: { method: 'totp' } }), { status: 401 })
			)
			.mockResolvedValueOnce({ success: true });
		(twoFactor as jest.Mock)
			.mockResolvedValueOnce({ twoFactorCode: '111111', twoFactorMethod: 'totp' })
			.mockResolvedValueOnce({ twoFactorCode: '222222', twoFactorMethod: 'totp' });

		setInternalSdk(fake);
		const result = await (sdk as any).post('/v1/channels.create', { name: 'test' });

		expect(fake.rest.post).toHaveBeenCalledTimes(3);
		expect(twoFactor).toHaveBeenCalledTimes(2);
		expect(twoFactor).toHaveBeenNthCalledWith(1, { method: 'totp', invalid: false });
		expect(twoFactor).toHaveBeenNthCalledWith(2, { method: 'totp', invalid: true });
		expect(result).toEqual({ success: true });
	});

	it('does not leak x-2fa-code into a concurrent request while a 2FA retry is in flight', async () => {
		// The retried call is held open on this gate so we can read shared headers while it is still in flight.
		let releaseRetry!: (value: any) => void;
		const retryGate = new Promise(resolve => {
			releaseRetry = resolve;
		});

		const post = jest.fn();
		post.mockRejectedValueOnce({ data: { errorType: 'totp-required', details: { method: 'totp' } } });
		post.mockImplementationOnce(() => retryGate);

		const fake = buildFakeSdkWithRest({ rest: { post } });
		setInternalSdk(fake);
		(twoFactor as jest.Mock).mockResolvedValueOnce({ twoFactorCode: '123456', twoFactorMethod: 'totp' });

		const retryPromise = (sdk as any).post('/v1/rooms.info', {});

		// Let the retry run up to the point where it has fired its retried network call (still pending on retryGate).
		await new Promise(resolve => setTimeout(resolve, 0));

		// A concurrent, unrelated call reads the shared headers while the 2FA retry is still in flight.
		const concurrentHeaders = sdk.getHeaders();

		releaseRetry({ success: true });
		const result = await retryPromise;

		expect(result).toEqual({ success: true });
		expect(concurrentHeaders['x-2fa-code']).toBeUndefined();
	});
});

describe('Sdk.methodCall', () => {
	const buildFakeSdkWithMethod = (callAsyncWithOptions: jest.Mock) => ({
		client: { callAsyncWithOptions },
		connection: buildFakeConnection(),
		account: { user: { id: 'u1', token: 't1' } }
	});

	it('forwards method + params to callAsyncWithOptions', async () => {
		const callAsync = jest.fn().mockResolvedValue({ result: 'ok' });
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		const result = await (sdk as any).methodCall('myMethod', 'arg1', 42);
		expect(callAsync).toHaveBeenCalledWith('myMethod', {}, 'arg1', 42);
		expect(result).toEqual({ result: 'ok' });
	});

	it('appends the resolved TOTP code to params when a retry is in flight', async () => {
		const callAsync = jest
			.fn()
			.mockRejectedValueOnce({ error: 'totp-required', details: { method: 'totp' } })
			.mockResolvedValueOnce({});
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '654321', twoFactorMethod: 'totp' });
		await (sdk as any).methodCall('myMethod', 'arg1');
		expect(callAsync).toHaveBeenNthCalledWith(2, 'myMethod', {}, 'arg1', { twoFactorCode: '654321', twoFactorMethod: 'totp' });
	});

	it('does not leak a pending 2FA code into a concurrent, unrelated methodCall() that never needed 2FA', async () => {
		const createDeferred = <T>() => {
			let resolve!: (value: T) => void;
			let reject!: (reason?: any) => void;
			const promise = new Promise<T>((res, rej) => {
				resolve = res;
				reject = rej;
			});
			return { promise, resolve, reject };
		};

		const attempt1A = createDeferred<any>();
		const retryA = createDeferred<any>();
		const challengeA = createDeferred<any>();
		const callAsync = jest
			.fn()
			.mockImplementationOnce(() => attempt1A.promise) // methodA attempt 1
			.mockImplementationOnce(() => retryA.promise) // methodA retry (kept pending)
			.mockImplementationOnce((_method: string, _opts: any, ...rest: any[]) => Promise.resolve({ methodCArgs: rest })); // methodC attempt 1
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(twoFactor as jest.Mock).mockReturnValueOnce(challengeA.promise);

		const callAPromise = (sdk as any).methodCall('methodA');
		attempt1A.reject({ error: 'totp-required', details: { method: 'totp' } });
		await Promise.resolve().then(() => Promise.resolve()); // let the catch handler call twoFactor()
		challengeA.resolve({ twoFactorCode: 'a-code', twoFactorMethod: 'totp' });
		await Promise.resolve().then(() => Promise.resolve()); // let this.code-equivalent retry kick off (now pending on retryA)

		const callCResult = await (sdk as any).methodCall('methodC'); // unrelated, never hits a 2FA error
		expect(callCResult.methodCArgs).toEqual([]);

		retryA.resolve({ ok: true });
		await callAPromise;
	});

	it('handles totp-required by prompting twoFactor and retrying', async () => {
		const callAsync = jest
			.fn()
			.mockRejectedValueOnce({ error: 'totp-required', details: { method: 'totp' } })
			.mockResolvedValueOnce({ result: 'ok' });
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '123456', twoFactorMethod: 'totp' });
		const result = await (sdk as any).methodCall('myMethod');
		expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false });
		expect(result).toEqual({ result: 'ok' });
	});

	it('marks invalid:true when retrying after totp-invalid', async () => {
		const callAsync = jest
			.fn()
			.mockRejectedValueOnce({ error: 'totp-invalid', details: { method: 'totp' } })
			.mockResolvedValueOnce({ result: 'ok' });
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(twoFactor as jest.Mock).mockResolvedValue({ twoFactorCode: '999999', twoFactorMethod: 'totp' });
		await (sdk as any).methodCall('myMethod');
		expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: true });
	});

	it('uses the second code — not the first — when the first TOTP attempt is invalid', async () => {
		// Flow: totp-required → code '111111' stored → totp-invalid → code '222222' stored → 3rd call uses '222222'
		const callAsync = jest
			.fn()
			.mockRejectedValueOnce({ error: 'totp-required', details: { method: 'totp' } })
			.mockRejectedValueOnce({ error: 'totp-invalid', details: { method: 'totp' } })
			.mockResolvedValueOnce({ result: 'ok' });
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(twoFactor as jest.Mock)
			.mockResolvedValueOnce({ twoFactorCode: '111111', twoFactorMethod: 'totp' })
			.mockResolvedValueOnce({ twoFactorCode: '222222', twoFactorMethod: 'totp' });

		await (sdk as any).methodCall('myMethod');

		expect(callAsync).toHaveBeenCalledTimes(3);
		// 2nd call carries the first code
		expect(callAsync).toHaveBeenNthCalledWith(2, 'myMethod', {}, { twoFactorCode: '111111', twoFactorMethod: 'totp' });
		// 3rd call must carry the NEW code, not the stale first one
		expect(callAsync).toHaveBeenNthCalledWith(3, 'myMethod', {}, { twoFactorCode: '222222', twoFactorMethod: 'totp' });
	});

	it('returns {} when twoFactor is cancelled mid-retry', async () => {
		const callAsync = jest.fn().mockRejectedValue({ error: 'totp-required', details: { method: 'totp' } });
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(twoFactor as jest.Mock).mockRejectedValue(new Error('cancelled'));
		const result = await (sdk as any).methodCall('myMethod');
		expect(result).toEqual({});
	});

	it('rejects non-2FA errors', async () => {
		const callAsync = jest.fn().mockRejectedValue(new Error('some error'));
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		await expect((sdk as any).methodCall('myMethod')).rejects.toThrow('some error');
	});

	it('rejects when sdk is not initialized', async () => {
		setInternalSdk(undefined);
		await expect((sdk as any).methodCall('myMethod')).rejects.toThrow('SDK not initialized');
	});
});

describe('Sdk.methodCallWrapper', () => {
	it('uses methodCall (WebSocket) when API_Use_REST_For_DDP_Calls is false', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			settings: { API_Use_REST_For_DDP_Calls: false },
			login: { user: { id: 'u1' } }
		});
		const methodCallSpy = jest.spyOn(sdk as any, 'methodCall').mockResolvedValue('ws-result');
		const result = await (sdk as any).methodCallWrapper('myMethod', 'arg1');
		expect(methodCallSpy).toHaveBeenCalledWith('myMethod', 'arg1');
		expect(result).toBe('ws-result');
		methodCallSpy.mockRestore();
	});

	it('uses /v1/method.call (REST) when API_Use_REST_For_DDP_Calls is true and user is present', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			settings: { API_Use_REST_For_DDP_Calls: true },
			login: { user: { id: 'u1' } }
		});
		const postSpy = jest.spyOn(sdk as any, 'post').mockResolvedValue('rest-result');
		const result = await (sdk as any).methodCallWrapper('myMethod', { x: 1 });
		expect(postSpy).toHaveBeenCalledWith('/v1/method.call/myMethod', expect.objectContaining({ message: expect.any(String) }));
		expect(result).toBe('rest-result');
		postSpy.mockRestore();
	});

	it('uses /v1/method.callAnon when user is empty and REST is enabled', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			settings: { API_Use_REST_For_DDP_Calls: true },
			login: { user: {} }
		});
		const postSpy = jest.spyOn(sdk as any, 'post').mockResolvedValue('anon');
		await (sdk as any).methodCallWrapper('myMethod');
		expect(postSpy).toHaveBeenCalledWith('/v1/method.callAnon/myMethod', expect.any(Object));
		postSpy.mockRestore();
	});

	it('converts Date params to { $date: ms } for the WebSocket path', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			settings: { API_Use_REST_For_DDP_Calls: false },
			login: { user: { id: 'u1' } }
		});
		const methodCallSpy = jest.spyOn(sdk as any, 'methodCall').mockResolvedValue(undefined);
		const ts = 1704067200000;
		await (sdk as any).methodCallWrapper('myMethod', new Date(ts));
		expect(methodCallSpy).toHaveBeenCalledWith('myMethod', { $date: ts });
		methodCallSpy.mockRestore();
	});

	it('propagates rejection from post() when the REST method call errors', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({
			settings: { API_Use_REST_For_DDP_Calls: true },
			login: { user: { id: 'u1' } }
		});
		const postSpy = jest.spyOn(sdk as any, 'post').mockRejectedValue({ error: 'app-error' });
		await expect((sdk as any).methodCallWrapper('myMethod')).rejects.toEqual({ error: 'app-error' });
		postSpy.mockRestore();
	});
});

describe('Sdk.get', () => {
	it('forwards params and headers to rest.get', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.get.mockResolvedValue({ users: [] });
		setInternalSdk(fake);
		const result = await (sdk as any).get('/v1/users.list', { count: 10 });
		expect(fake.rest.get).toHaveBeenCalledWith(
			'/v1/users.list',
			{ count: 10 },
			expect.objectContaining({ headers: expect.any(Object) })
		);
		expect(result).toEqual({ users: [] });
	});

	it('normalizes fetch Response errors', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.get.mockRejectedValue(new Response('{}', { status: 500 }));
		setInternalSdk(fake);
		await expect((sdk as any).get('/v1/users.list')).rejects.toEqual({ status: 500, data: {} });
	});

	it('rethrows non-Response errors', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.get.mockRejectedValue(new Error('boom'));
		setInternalSdk(fake);
		await expect((sdk as any).get('/v1/users.list')).rejects.toThrow('boom');
	});
});

describe('Sdk.delete', () => {
	it('forwards params and headers to rest.delete', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.delete.mockResolvedValue({ success: true });
		setInternalSdk(fake);
		const result = await (sdk as any).delete('/v1/push.token', { token: 'abc' });
		expect(fake.rest.delete).toHaveBeenCalledWith(
			'/v1/push.token',
			{ token: 'abc' },
			expect.objectContaining({ headers: expect.any(Object) })
		);
		expect(result).toEqual({ success: true });
	});

	it('normalizes a Response error', async () => {
		const fake = buildFakeSdkWithRest();
		fake.rest.delete.mockRejectedValue(new Response(JSON.stringify({ error: 'nope' }), { status: 403 }));
		setInternalSdk(fake);
		await expect((sdk as any).delete('/v1/push.token', { token: 'abc' })).rejects.toEqual({
			status: 403,
			data: { error: 'nope' }
		});
	});
});

describe('Sdk header lifecycle', () => {
	it('includes a User-Agent by default', () => {
		const headers = sdk.getHeaders();
		expect(headers['User-Agent']).toMatch(/^RC Mobile/);
	});

	it('adds Authorization on setBasicAuth(token) and persists to UserPreferences', () => {
		(sdk as any).serverUrl = 'https://example.com';
		sdk.setBasicAuth('dXNlcjpwYXNz');
		expect(sdk.getHeaders().Authorization).toBe('Basic dXNlcjpwYXNz');
		expect(UserPreferences.setString).toHaveBeenCalledWith('BASIC_AUTH_KEY-https://example.com', 'dXNlcjpwYXNz');
	});

	it('removes Authorization on setBasicAuth(null) and clears UserPreferences', () => {
		(sdk as any).serverUrl = 'https://example.com';
		sdk.setBasicAuth('dXNlcjpwYXNz');
		sdk.setBasicAuth(null);
		expect(sdk.getHeaders().Authorization).toBeUndefined();
		expect(UserPreferences.removeItem).toHaveBeenCalledWith('BASIC_AUTH_KEY-https://example.com');
	});

	it('getHeaders returns a copy — mutating it does not affect internal headers', () => {
		(sdk as any).serverUrl = 'https://example.com';
		sdk.setBasicAuth('dXNlcjpwYXNz');
		const headers = sdk.getHeaders();
		delete (headers as any).Authorization; // mutate the returned copy
		expect(sdk.getHeaders().Authorization).toBe('Basic dXNlcjpwYXNz');
	});

	it('persists setBasicAuth under an explicitly passed server, not the stale this.serverUrl (switch-server regression)', () => {
		(sdk as any).serverUrl = 'https://old.example.com';
		sdk.setBasicAuth('dXNlcjpwYXNz', 'https://new.example.com');
		expect(UserPreferences.setString).toHaveBeenCalledWith('BASIC_AUTH_KEY-https://new.example.com', 'dXNlcjpwYXNz');
		expect(UserPreferences.setString).not.toHaveBeenCalledWith('BASIC_AUTH_KEY-https://old.example.com', expect.anything());
	});

	it('clears setBasicAuth(null) under an explicitly passed server, not the stale this.serverUrl', () => {
		(sdk as any).serverUrl = 'https://old.example.com';
		sdk.setBasicAuth(null, 'https://new.example.com');
		expect(UserPreferences.removeItem).toHaveBeenCalledWith('BASIC_AUTH_KEY-https://new.example.com');
		expect(UserPreferences.removeItem).not.toHaveBeenCalledWith('BASIC_AUTH_KEY-https://old.example.com');
	});
});

describe('Sdk.onStreamData', () => {
	it('resolves with a noop stop when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		const { stop } = await sdk.onStreamData('any', jest.fn());
		expect(typeof stop).toBe('function');
		expect(() => stop()).not.toThrow();
	});

	it('subscribes via client.onCollection and exposes the handle as stop', async () => {
		const stopHandle = jest.fn();
		const onCollection = jest.fn().mockReturnValue(stopHandle);
		setInternalSdk({ client: { onCollection } });
		const { stop } = await sdk.onStreamData('stream-notify-user', jest.fn());
		expect(onCollection).toHaveBeenCalledWith('stream-notify-user', expect.any(Function));
		expect(stop).toBe(stopHandle);
	});

	it('invokes the callback only when ddpMessage has fields', async () => {
		const cb = jest.fn();
		const onCollection = jest.fn((_: string, handler: (m: any) => void) => {
			handler({ msg: 'changed' });
			handler({ msg: 'changed', fields: { eventName: 'x' } });
			return jest.fn();
		});
		setInternalSdk({ client: { onCollection } });
		await sdk.onStreamData('test', cb);
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith({ msg: 'changed', fields: { eventName: 'x' } });
	});
});

describe('Sdk.onLogin', () => {
	it('returns a noop unsubscribe when sdk.current is undefined', () => {
		setInternalSdk(undefined);
		const stop = sdk.onLogin(jest.fn());
		expect(typeof stop).toBe('function');
		expect(() => stop()).not.toThrow();
	});

	it('subscribes via account.on("uid", ...) and exposes the handle as stop', () => {
		const stopHandle = jest.fn();
		const on = jest.fn().mockReturnValue(stopHandle);
		setInternalSdk({ account: { on } });
		const stop = sdk.onLogin(jest.fn());
		expect(on).toHaveBeenCalledWith('uid', expect.any(Function));
		expect(stop).toBe(stopHandle);
	});

	it('invokes the callback only when uid is set (skips the logout emission)', () => {
		const callback = jest.fn();
		const on = jest.fn((_: string, handler: (uid?: string) => void) => {
			handler(undefined);
			handler('u1');
			return jest.fn();
		});
		setInternalSdk({ account: { on } });
		sdk.onLogin(callback);
		expect(callback).toHaveBeenCalledTimes(1);
	});
});

describe('Sdk.initialize', () => {
	it('calls DDPSDK.create with the server URL and stores it', () => {
		const handleTwoFactorChallenge = jest.fn();
		const fake = { rest: { handleTwoFactorChallenge } } as any;
		(DDPSDK.create as jest.Mock).mockReturnValue(fake);
		sdk.initialize('https://example.com');
		expect(DDPSDK.create).toHaveBeenCalledWith('https://example.com');
		expect(sdk.server).toBe('https://example.com');
	});

	it('attaches subscribeNotifyUser onto the DDPSDK instance', () => {
		const handleTwoFactorChallenge = jest.fn();
		const fake = { rest: { handleTwoFactorChallenge } } as any;
		(DDPSDK.create as jest.Mock).mockReturnValue(fake);
		sdk.initialize('https://example.com');
		expect(typeof fake.subscribeNotifyUser).toBe('function');
	});

	it('registers handleTwoFactorChallenge on the REST client', () => {
		const handleTwoFactorChallenge = jest.fn();
		(DDPSDK.create as jest.Mock).mockReturnValue({ rest: { handleTwoFactorChallenge } });
		sdk.initialize('https://example.com');
		expect(handleTwoFactorChallenge).toHaveBeenCalledWith(expect.any(Function));
	});

	it('resolves the registered 2FA challenge handler with the code from twoFactor() — covers GET/DELETE 2FA', async () => {
		const handleTwoFactorChallenge = jest.fn();
		(DDPSDK.create as jest.Mock).mockReturnValue({ rest: { handleTwoFactorChallenge } });
		sdk.initialize('https://example.com');
		const registeredHandler = handleTwoFactorChallenge.mock.calls[0][0];

		(twoFactor as jest.Mock).mockResolvedValueOnce({ twoFactorCode: '654321', twoFactorMethod: 'totp' });

		const code = await registeredHandler({ method: 'totp', invalidAttempt: false });

		expect(code).toBe('654321');
		expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: false });
	});

	it('propagates a cancellation from the registered 2FA challenge handler', async () => {
		const handleTwoFactorChallenge = jest.fn();
		(DDPSDK.create as jest.Mock).mockReturnValue({ rest: { handleTwoFactorChallenge } });
		sdk.initialize('https://example.com');
		const registeredHandler = handleTwoFactorChallenge.mock.calls[0][0];

		(twoFactor as jest.Mock).mockRejectedValueOnce(new Error('cancelled'));

		await expect(registeredHandler({ method: 'totp', invalidAttempt: true })).rejects.toThrow('cancelled');
		expect(twoFactor).toHaveBeenCalledWith({ method: 'totp', invalid: true });
	});

	it('resets headers to defaults — does not carry Authorization across server switches', () => {
		(sdk as any).serverUrl = 'https://old';
		sdk.setBasicAuth('dXNlcjpwYXNz');
		expect(sdk.getHeaders().Authorization).toBe('Basic dXNlcjpwYXNz');
		(DDPSDK.create as jest.Mock).mockReturnValue({ rest: { handleTwoFactorChallenge: jest.fn() } });
		sdk.initialize('https://new');
		expect(sdk.getHeaders().Authorization).toBeUndefined();
	});

	it('loads Basic Auth from UserPreferences on initialize when present', () => {
		(UserPreferences.getString as jest.Mock).mockImplementation((key: string) =>
			key === 'BASIC_AUTH_KEY-https://example.com' ? 'cmVzdW1lOnRva2Vu' : null
		);
		(DDPSDK.create as jest.Mock).mockReturnValue({ rest: { handleTwoFactorChallenge: jest.fn() } });
		sdk.initialize('https://example.com');
		expect(sdk.getHeaders().Authorization).toBe('Basic cmVzdW1lOnRva2Vu');
	});
});

describe('Sdk.subscribeRoom', () => {
	const buildRoomSubscribeMock = () => {
		const subscribe = jest.fn((..._args: any[]) => ({ id: 'sub', stop: jest.fn() }));
		return { client: { subscribe }, __subscribe: subscribe };
	};

	it('returns [] when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		await expect(sdk.subscribeRoom('rid-1')).resolves.toEqual([]);
	});

	it('subscribes to user-activity for RC >= 4.0', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({ server: { version: '4.0.0' } });
		const fake = buildRoomSubscribeMock();
		setInternalSdk(fake);
		await sdk.subscribeRoom('rid-1');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-room', 'rid-1/user-activity');
	});

	it('falls back to typing for RC < 4.0', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({ server: { version: '3.9.0' } });
		const fake = buildRoomSubscribeMock();
		setInternalSdk(fake);
		await sdk.subscribeRoom('rid-1');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-room', 'rid-1/typing');
	});

	it('subscribes to all 5 room channels', async () => {
		(reduxStore.getState as jest.Mock).mockReturnValue({ server: { version: '6.0.0' } });
		const fake = buildRoomSubscribeMock();
		setInternalSdk(fake);
		const subs = await sdk.subscribeRoom('rid-1');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-room-messages', 'rid-1');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-room', 'rid-1/deleteMessage');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-room', 'rid-1/deleteMessageBulk');
		expect(fake.__subscribe).toHaveBeenCalledWith('stream-notify-room', 'rid-1/messagesRead');
		expect(subs).toHaveLength(5);
	});

	it('logs the error when subscribing throws, instead of swallowing it silently', async () => {
		const log = jest.requireMock('../methods/helpers/log').default;
		const fake = {
			client: {
				subscribe: jest.fn(() => {
					throw new Error('socket not ready');
				})
			}
		};
		setInternalSdk(fake);
		const result = await sdk.subscribeRoom('room-1');
		expect(result).toEqual([]);
		expect(log).toHaveBeenCalledWith(expect.any(Error));
	});
});

describe('Sdk.disconnect', () => {
	it('closes the connection and clears server when sdk is initialized', () => {
		const close = jest.fn();
		setInternalSdk({ connection: { close } });
		(sdk as any).serverUrl = 'https://x.com';
		expect(sdk.disconnect()).toBeNull();
		expect(close).toHaveBeenCalledTimes(1);
		expect(sdk.server).toBeUndefined();
	});

	it('returns null without throwing when sdk is not initialized', () => {
		setInternalSdk(undefined);
		(sdk as any).serverUrl = 'https://x.com';
		expect(sdk.disconnect()).toBeNull();
		expect(sdk.server).toBeUndefined();
	});
});
