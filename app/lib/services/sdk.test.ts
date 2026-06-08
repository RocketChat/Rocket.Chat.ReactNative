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

const buildFakeConnection = (overrides: Partial<{ probe: jest.Mock; forceReopen: jest.Mock; close: jest.Mock }> = {}) => ({
	probe: jest.fn().mockResolvedValue(true),
	forceReopen: jest.fn().mockResolvedValue(true),
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
	(sdk as any).code = null;
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

describe('Sdk.forceReopen', () => {
	it('returns false when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		await expect(sdk.forceReopen()).resolves.toBe(false);
	});

	it('delegates to connection.forceReopen()', async () => {
		const connection = buildFakeConnection();
		setInternalSdk({ connection });
		await expect(sdk.forceReopen()).resolves.toBe(true);
		expect(connection.forceReopen).toHaveBeenCalledTimes(1);
	});

	it('returns the result from connection.forceReopen()', async () => {
		const connection = buildFakeConnection({ forceReopen: jest.fn().mockResolvedValue(false) });
		setInternalSdk({ connection });
		await expect(sdk.forceReopen()).resolves.toBe(false);
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
			success: true,
			data: { authToken: 'tok-abc', userId: 'uid-1', me: { username: 'john' } }
		});
		setInternalSdk(fake);
		const result = await sdk.login({ user: 'john', password: 'secret' });
		expect(fake.__loginWithToken).toHaveBeenCalledWith('tok-abc');
		expect(result.authToken).toBe('tok-abc');
	});

	it('rejects when the REST response has success: false', async () => {
		const fake = buildFakeSdkWithLogin({ success: false });
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
			success: true,
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
			success: true,
			data: { authToken: 'tok-abc', userId: 'uid-1', me: { username: 'john' } }
		});
		setInternalSdk(fake);
		await sdk.login({ user: 'john', password: 'secret' });
		await sdk.logout();
		const headers = sdk.getHeaders();
		expect(headers['X-Auth-Token']).toBe('');
		expect(headers['X-User-Id']).toBe('');
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

	it('appends stored TOTP code to params when present', async () => {
		const callAsync = jest.fn().mockResolvedValue({});
		setInternalSdk(buildFakeSdkWithMethod(callAsync));
		(sdk as any).code = '654321';
		await (sdk as any).methodCall('myMethod', 'arg1');
		expect(callAsync).toHaveBeenCalledWith('myMethod', {}, 'arg1', '654321');
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

	it('clears any stored TOTP code on initialize', () => {
		(sdk as any).code = '123456';
		(DDPSDK.create as jest.Mock).mockReturnValue({ rest: { handleTwoFactorChallenge: jest.fn() } });
		sdk.initialize('https://example.com');
		expect((sdk as any).code).toBeNull();
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
