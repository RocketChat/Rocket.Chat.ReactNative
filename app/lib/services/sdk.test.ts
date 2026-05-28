import sdk, { NOTIFY_USER_EVENTS, normalizeResponseError } from './sdk';

const setInternalSdk = (value: any) => {
	(sdk as unknown as { sdk: any }).sdk = value;
};

const buildFakeConnection = (overrides: Partial<{ probe: jest.Mock; forceReopen: jest.Mock }> = {}) => ({
	probe: jest.fn().mockResolvedValue(true),
	forceReopen: jest.fn().mockResolvedValue(true),
	...overrides
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
	const buildFakeSdkWithLogin = (postResult: any, loginWithToken = jest.fn().mockResolvedValue(undefined)) => {
		const post = jest.fn().mockResolvedValue(postResult);
		return {
			client: { ddp: {} },
			connection: buildFakeConnection(),
			account: { loginWithToken },
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
