import sdk from './sdk';

const setInternalSdk = (value: any) => {
	(sdk as unknown as { sdk: any }).sdk = value;
};

const buildFakeDdp = () => {
	const pongHandlers = new Set<() => void>();
	const ping = jest.fn();
	const on = jest.fn((event: string, cb: () => void) => {
		if (event === 'pong') pongHandlers.add(cb);
		return () => pongHandlers.delete(cb);
	});
	const emitPong = () => pongHandlers.forEach(cb => cb());
	return { ping, on, emitPong, pongHandlers };
};

const buildFakeConnection = (overrides: Partial<{ close: jest.Mock; reconnect: jest.Mock }> = {}) => ({
	close: jest.fn(),
	reconnect: jest.fn().mockResolvedValue(true),
	...overrides
});

const buildFakeSdk = (opts: { ddp?: any; connection?: any } = {}) => {
	const fakeDdp = opts.ddp ?? buildFakeDdp();
	const fakeConnection = opts.connection ?? buildFakeConnection();
	return {
		client: { ddp: fakeDdp },
		connection: fakeConnection,
		__fakeDdp: fakeDdp,
		__fakeConnection: fakeConnection
	};
};

afterEach(() => {
	setInternalSdk(undefined);
	(sdk as unknown as { reopenInFlight: Promise<boolean> | null }).reopenInFlight = null;
	jest.useRealTimers();
});

describe('Sdk.probe', () => {
	it('returns false when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		await expect(sdk.probe()).resolves.toBe(false);
	});

	it('returns false when inner ddp client lacks ping/on (defensive)', async () => {
		setInternalSdk({ client: {}, connection: buildFakeConnection() });
		await expect(sdk.probe()).resolves.toBe(false);
	});

	it('resolves true when pong fires before the timeout', async () => {
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		const promise = sdk.probe(2000);
		fake.__fakeDdp.emitPong();
		await expect(promise).resolves.toBe(true);
		expect(fake.__fakeDdp.ping).toHaveBeenCalledTimes(1);
	});

	it('resolves false when timeout elapses without pong', async () => {
		jest.useFakeTimers();
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		const promise = sdk.probe(2000);
		jest.advanceTimersByTime(2000);
		await expect(promise).resolves.toBe(false);
	});

	it('resolves false when ping() throws', async () => {
		const fake = buildFakeSdk();
		fake.__fakeDdp.ping.mockImplementation(() => {
			throw new Error('boom');
		});
		setInternalSdk(fake);
		await expect(sdk.probe()).resolves.toBe(false);
	});

	it('removes the pong listener after settling so it does not leak', async () => {
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		const promise = sdk.probe(2000);
		fake.__fakeDdp.emitPong();
		await promise;
		expect(fake.__fakeDdp.pongHandlers.size).toBe(0);
	});

	it('ignores a late pong after timeout (does not double-resolve)', async () => {
		jest.useFakeTimers();
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		const promise = sdk.probe(2000);
		jest.advanceTimersByTime(2000);
		await expect(promise).resolves.toBe(false);
		// Late pong arrives. With the listener cleaned up, this is a no-op.
		expect(() => fake.__fakeDdp.emitPong()).not.toThrow();
	});
});

describe('Sdk.forceReopen', () => {
	it('returns false when sdk.current is undefined', async () => {
		setInternalSdk(undefined);
		await expect(sdk.forceReopen()).resolves.toBe(false);
	});

	it('calls connection.close then connection.reconnect', async () => {
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		await sdk.forceReopen();
		expect(fake.__fakeConnection.close).toHaveBeenCalledTimes(1);
		expect(fake.__fakeConnection.reconnect).toHaveBeenCalledTimes(1);
		// close before reconnect
		const closeOrder = fake.__fakeConnection.close.mock.invocationCallOrder[0];
		const reconnectOrder = fake.__fakeConnection.reconnect.mock.invocationCallOrder[0];
		expect(closeOrder).toBeLessThan(reconnectOrder);
	});

	it('resolves true when reconnect resolves truthy', async () => {
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		await expect(sdk.forceReopen()).resolves.toBe(true);
	});

	it('resolves false when reconnect rejects (does not throw)', async () => {
		const fake = buildFakeSdk({
			connection: buildFakeConnection({ reconnect: jest.fn().mockRejectedValue(new Error('conn in progress')) })
		});
		setInternalSdk(fake);
		await expect(sdk.forceReopen()).resolves.toBe(false);
	});

	it('coalesces concurrent calls to the same in-flight promise', async () => {
		let resolveReconnect: (v: boolean) => void = () => undefined;
		const reconnect = jest.fn(
			() =>
				new Promise<boolean>(res => {
					resolveReconnect = res;
				})
		);
		const fake = buildFakeSdk({ connection: buildFakeConnection({ reconnect }) });
		setInternalSdk(fake);

		const a = sdk.forceReopen();
		const b = sdk.forceReopen();

		expect(a).toBe(b);
		expect(reconnect).toHaveBeenCalledTimes(1);
		expect(fake.__fakeConnection.close).toHaveBeenCalledTimes(1);

		resolveReconnect(true);
		await Promise.all([a, b]);
	});

	it('clears the in-flight slot after the reopen settles so the next call starts fresh', async () => {
		const fake = buildFakeSdk();
		setInternalSdk(fake);
		await sdk.forceReopen();
		await sdk.forceReopen();
		expect(fake.__fakeConnection.reconnect).toHaveBeenCalledTimes(2);
		expect(fake.__fakeConnection.close).toHaveBeenCalledTimes(2);
	});

	it('still proceeds when close() throws', async () => {
		const fake = buildFakeSdk({
			connection: buildFakeConnection({
				close: jest.fn(() => {
					throw new Error('already closed');
				})
			})
		});
		setInternalSdk(fake);
		await expect(sdk.forceReopen()).resolves.toBe(true);
		expect(fake.__fakeConnection.reconnect).toHaveBeenCalledTimes(1);
	});
});

describe('Sdk.subscribeNotifyUser', () => {
	const EXPECTED_EVENTS = [
		'message',
		'notification',
		'rooms-changed',
		'subscriptions-changed',
		'uiInteraction',
		'e2ekeyRequest',
		'userData',
		'video-conference',
		'media-signal',
		'media-calls'
	];

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
		expect(handles).toHaveLength(EXPECTED_EVENTS.length);
		EXPECTED_EVENTS.forEach(event => {
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
			client: { ddp: buildFakeDdp() },
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
