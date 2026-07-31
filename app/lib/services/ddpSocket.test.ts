// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Socket, DDPDriver } = require('@rocket.chat/sdk/lib/drivers/ddp');

const mockConnections: any[] = [];
const trackedSockets: any[] = [];

jest.mock('universal-websocket-client', () => {
	return jest.fn().mockImplementation(() => {
		const connection = {
			send: jest.fn((data: string) => {
				const message = JSON.parse(data);
				if (message.msg === 'connect') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'connected', session: 'session-id' }) }));
				} else if (message.msg === 'ping') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'pong' }) }));
				}
			}),
			close: jest.fn(),
			readyState: 1,
			onopen: jest.fn(),
			onmessage: jest.fn(),
			onerror: jest.fn(),
			onclose: jest.fn()
		};
		mockConnections.push(connection);
		return connection;
	});
});

const buildSocket = () => {
	const socket = new Socket({
		logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() },
		timeout: 10000
	});
	trackedSockets.push(socket);
	const send = jest.fn();
	const close = jest.fn();
	socket.connection = {
		send,
		close,
		readyState: 1,
		onopen: jest.fn(),
		onmessage: jest.fn(),
		onerror: jest.fn(),
		onclose: jest.fn()
	};
	return { socket, send, close };
};

const trackSocket = (socket: any) => {
	trackedSockets.push(socket);
	return socket;
};

beforeEach(() => {
	mockConnections.length = 0;
	trackedSockets.length = 0;
});

afterEach(() => {
	trackedSockets.forEach(socket => {
		if (socket.openTimeout) clearTimeout(socket.openTimeout as any);
		if (socket.pingTimeout) clearTimeout(socket.pingTimeout as any);
	});
});

describe('Socket.probe', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it('resolves true when pong arrives within deadline', async () => {
		const { socket } = buildSocket();
		const probePromise = socket.probe();
		socket.lastPing += 1;
		socket.emit('pong');
		await expect(probePromise).resolves.toBe(true);
	});

	it('resolves false when no pong arrives within 2s deadline', async () => {
		jest.useFakeTimers();
		const { socket } = buildSocket();
		const probePromise = socket.probe();
		await jest.advanceTimersByTimeAsync(2000);
		await expect(probePromise).resolves.toBe(false);
	});

	it('resolves false when raw connection.send throws', async () => {
		const { socket, send } = buildSocket();
		send.mockImplementation(() => {
			throw new Error('boom');
		});
		await expect(socket.probe()).resolves.toBe(false);
	});

	it('resolves false when readyState is not open', async () => {
		const { socket } = buildSocket();
		socket.connection.readyState = 2;
		await expect(socket.probe()).resolves.toBe(false);
	});

	it('ignores a stale pong that does not advance lastPing', async () => {
		jest.useFakeTimers();
		const { socket } = buildSocket();
		const initialLastPing = Date.now() - 1000;
		socket.lastPing = initialLastPing;

		const probePromise = socket.probe();
		socket.emit('pong');

		await jest.advanceTimersByTimeAsync(2000);
		await expect(probePromise).resolves.toBe(false);
	});
});

describe('Socket.reopenNow', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it('preserves subscriptions and subscribeAll re-sends them', async () => {
		const { socket } = buildSocket();
		const subscription = {
			id: 'sub-1',
			name: 'stream-room-messages',
			params: ['rid'],
			unsubscribe: jest.fn()
		};
		socket.subscriptions['sub-1'] = subscription;

		const sendSpy = jest.spyOn(socket, 'send').mockResolvedValue({ subs: ['sub-1'] });

		const reopenPromise = socket.reopenNow();
		mockConnections[0].onopen();
		await reopenPromise;

		expect(socket.subscriptions['sub-1']).toBe(subscription);

		await socket.subscribeAll();

		expect(sendSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: 'sub',
				id: 'sub-1',
				name: 'stream-room-messages',
				params: ['rid']
			})
		);
	});

	it("emits 'disconnected' and rejects in-flight send()", async () => {
		const { socket } = buildSocket();
		const disconnectedListener = jest.fn();
		socket.on('disconnected', disconnectedListener);
		const sendPromise = socket.send({ msg: 'ping' });

		const reopenPromise = socket.reopenNow();

		expect(disconnectedListener).toHaveBeenCalledTimes(1);
		await expect(sendPromise).rejects.toBeUndefined();

		mockConnections[0].onopen();
		await reopenPromise;
	});

	it('concurrent calls create exactly one new WebSocket', async () => {
		const socket = trackSocket(
			new Socket({
				logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() },
				timeout: 10000
			})
		);

		const a = socket.reopenNow();
		const b = socket.reopenNow();

		expect(mockConnections).toHaveLength(1);

		mockConnections[0].onopen();

		await Promise.all([a, b]);
	});

	it('times out and clears in-flight state so a later reopenNow retries', async () => {
		jest.useFakeTimers();
		const socket = trackSocket(
			new Socket({
				logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() },
				timeout: 10000
			})
		);

		const promise = socket.reopenNow();
		expect(socket.reopenPromise).toBeTruthy();

		await jest.advanceTimersByTimeAsync(10000);
		await promise;

		expect(socket.reopenPromise).toBeUndefined();

		const secondPromise = socket.reopenNow();
		expect(mockConnections).toHaveLength(2);

		mockConnections[1].onopen();
		await jest.runOnlyPendingTimersAsync();
		await secondPromise;
	});

	it('forces a reconnect on an already healthy socket', async () => {
		const { socket } = buildSocket();
		const initialConnection = socket.connection;

		const promise = socket.reopenNow();

		expect(mockConnections).toHaveLength(1);
		expect(initialConnection.close).toHaveBeenCalled();

		mockConnections[0].onopen();
		await promise;

		expect(socket.connection).toBe(mockConnections[0]);
	});

	it('serializes against concurrent open(): no second socket, no closing in-flight one', async () => {
		const socket = trackSocket(
			new Socket({
				logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() },
				timeout: 10000
			})
		);

		const reopenPromise = socket.reopenNow();
		const inFlightConnection = mockConnections[0];

		const openPromise = socket.open();
		expect(mockConnections).toHaveLength(1);
		expect(inFlightConnection.close).not.toHaveBeenCalled();

		mockConnections[0].onopen();
		await reopenPromise;
		await openPromise;
	});
});

describe('Socket.send disconnected listener', () => {
	it('cleans up the disconnected listener after send resolves', async () => {
		const { socket, send } = buildSocket();
		const baseline = socket._listeners.disconnected?.length || 0;
		send.mockImplementation(() => {
			setImmediate(() => socket.emit('pong', { msg: 'pong' }));
		});

		await socket.send({ msg: 'ping' });

		expect(socket._listeners.disconnected?.length || 0).toBe(baseline);
	});
});

describe('DDPDriver.waitForNotifyUserMediaSubs', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	const makeDriver = () =>
		new DDPDriver({
			logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() }
		});

	it('resolves true when media subs are present and server acks', async () => {
		const driver = makeDriver();
		driver.userId = 'uid';
		driver.ddp.subscriptions['sub-ms'] = {
			id: 'sub-ms',
			name: 'stream-notify-user',
			params: ['uid/media-signal'],
			unsubscribe: jest.fn()
		};
		driver.ddp.subscriptions['sub-mc'] = {
			id: 'sub-mc',
			name: 'stream-notify-user',
			params: ['uid/media-calls'],
			unsubscribe: jest.fn()
		};
		jest.spyOn(driver.ddp, 'subscribe').mockResolvedValue({});

		await expect(driver.waitForNotifyUserMediaSubs(1000)).resolves.toBe(true);
		expect(driver.ddp.subscribe).toHaveBeenCalledWith('stream-notify-user', ['uid/media-signal'], undefined, 'sub-ms');
		expect(driver.ddp.subscribe).toHaveBeenCalledWith('stream-notify-user', ['uid/media-calls'], undefined, 'sub-mc');
	});

	it('waits for media subs to appear before re-subscribing', async () => {
		jest.useFakeTimers();
		const driver = makeDriver();
		driver.userId = 'uid';
		jest.spyOn(driver.ddp, 'subscribe').mockResolvedValue({});

		const promise = driver.waitForNotifyUserMediaSubs(1000);
		driver.ddp.subscriptions['sub-ms'] = {
			id: 'sub-ms',
			name: 'stream-notify-user',
			params: ['uid/media-signal'],
			unsubscribe: jest.fn()
		};
		driver.ddp.subscriptions['sub-mc'] = {
			id: 'sub-mc',
			name: 'stream-notify-user',
			params: ['uid/media-calls'],
			unsubscribe: jest.fn()
		};

		await jest.advanceTimersByTimeAsync(100);
		await expect(promise).resolves.toBe(true);
		expect(driver.ddp.subscribe).toHaveBeenCalledTimes(2);
	});

	it('stays pending while only one of the media subs is present', async () => {
		jest.useFakeTimers();
		const driver = makeDriver();
		driver.userId = 'uid';
		jest.spyOn(driver.ddp, 'subscribe').mockResolvedValue({});

		let resolved: boolean | undefined;
		const promise = driver.waitForNotifyUserMediaSubs(1000).then((value: boolean) => {
			resolved = value;
			return value;
		});

		driver.ddp.subscriptions['sub-ms'] = {
			id: 'sub-ms',
			name: 'stream-notify-user',
			params: ['uid/media-signal'],
			unsubscribe: jest.fn()
		};

		await jest.advanceTimersByTimeAsync(100);
		expect(resolved).toBeUndefined();
		expect(driver.ddp.subscribe).not.toHaveBeenCalled();

		driver.ddp.subscriptions['sub-mc'] = {
			id: 'sub-mc',
			name: 'stream-notify-user',
			params: ['uid/media-calls'],
			unsubscribe: jest.fn()
		};

		await jest.advanceTimersByTimeAsync(100);
		await expect(promise).resolves.toBe(true);
	});

	it('resolves false if media subs never appear before the timeout', async () => {
		jest.useFakeTimers();
		const driver = makeDriver();
		driver.userId = 'uid';

		const promise = driver.waitForNotifyUserMediaSubs(500);
		await jest.advanceTimersByTimeAsync(500);

		await expect(promise).resolves.toBe(false);
	});

	it('resolves false when userId is missing', async () => {
		const driver = makeDriver();
		await expect(driver.waitForNotifyUserMediaSubs(1000)).resolves.toBe(false);
	});
});
