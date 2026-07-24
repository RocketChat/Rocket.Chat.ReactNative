// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Socket } = require('@rocket.chat/sdk/lib/drivers/ddp');

const buildSocket = () => {
	const socket = new Socket({
		logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() },
		timeout: 10000
	});
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

describe('Socket.probe', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it('resolves true when pong arrives within deadline', async () => {
		const { socket } = buildSocket();
		const probePromise = socket.probe();
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
});

describe('Socket.forceReopen awaitability', () => {
	it('returned promise resolves only after open() resolves', async () => {
		const { socket } = buildSocket();
		let resolveOpen: () => void = () => undefined;
		const openPromise = new Promise<void>(res => {
			resolveOpen = res;
		});
		socket.open = jest.fn(() => openPromise);

		let settled = false;
		const result = socket.forceReopen();
		result.then(() => {
			settled = true;
		});

		await Promise.resolve();
		await Promise.resolve();
		expect(settled).toBe(false);

		resolveOpen();
		await result;
		expect(settled).toBe(true);
	});

	it('concurrent invocations share the same in-flight reconnect', async () => {
		const { socket } = buildSocket();
		let resolveOpen: () => void = () => undefined;
		const openPromise = new Promise<void>(res => {
			resolveOpen = res;
		});
		const openMock = jest.fn(() => openPromise);
		socket.open = openMock;

		const a = socket.forceReopen();
		const b = socket.forceReopen();

		expect(openMock).toHaveBeenCalledTimes(1);

		resolveOpen();
		await Promise.all([a, b]);
		expect(openMock).toHaveBeenCalledTimes(1);
	});

	it("emits 'close' synchronously before opening so app-level Redux disconnect dispatches", async () => {
		const { socket } = buildSocket();
		socket.open = jest.fn(() => Promise.resolve());
		const closeListener = jest.fn();
		socket.on('close', closeListener);
		const reopenPromise = socket.forceReopen();
		// Synchronous emit: must have fired by the time forceReopen returns.
		expect(closeListener).toHaveBeenCalledTimes(1);
		const [event] = closeListener.mock.calls[0];
		expect(event).toEqual({ code: 4000 });
		await reopenPromise;
	});
});

describe('Socket subscription restoration (lib-led)', () => {
	const seed = (socket: any, name: string, params: unknown[], id: string) => {
		socket.subscriptions[id] = {
			id,
			name,
			params,
			unsubscribe: jest.fn(() => Promise.resolve()),
			onEvent: jest.fn()
		};
	};

	const subFrames = (send: jest.Mock) =>
		send.mock.calls.map(([raw]) => JSON.parse(raw as string)).filter(frame => frame.msg === 'sub');

	it('forceReopen keeps the subscription registry (subtraction 1)', async () => {
		const { socket } = buildSocket();
		socket.open = jest.fn(() => Promise.resolve());
		seed(socket, 'stream-notify-user', ['u1/message'], 'ddp-1');

		await socket.forceReopen();

		expect(Object.keys(socket.subscriptions)).toEqual(['ddp-1']);
	});

	it('subscribeAll replays each preserved sub exactly once, reusing its original id', () => {
		const { socket, send } = buildSocket();
		seed(socket, 'stream-notify-user', ['u1/message'], 'ddp-1');
		seed(socket, 'stream-room-messages', ['rid-1'], 'ddp-2');

		socket.subscribeAll();

		const frames = subFrames(send);
		expect(frames).toHaveLength(2);
		expect(frames.map(f => f.id).sort()).toEqual(['ddp-1', 'ddp-2']);
	});

	it('dedups two subscribe calls with identical name+params: one sub, one entry, both callbacks fire', async () => {
		const { socket, send } = buildSocket();
		const cb1 = jest.fn();
		const cb2 = jest.fn();

		const first = socket.subscribe('stream-room-messages', ['rid-1'], cb1);
		socket.subscribe('stream-room-messages', ['rid-1'], cb2);

		const frames = subFrames(send);
		expect(frames).toHaveLength(1);

		// Resolve the single sub so the first subscriber's callback attaches (confirmed path).
		socket.emit('ready', { subs: [frames[0].id] });
		await first;

		const entries = Object.values(socket.subscriptions).filter((s: any) => s.name === 'stream-room-messages');
		expect(entries).toHaveLength(1);

		socket.emit('stream-room-messages', { fields: {} });
		expect(cb1).toHaveBeenCalledTimes(1);
		expect(cb2).toHaveBeenCalledTimes(1);
	});

	it('keeps the registry flat across replay+re-subscribe cycles and per-room params separate', () => {
		const { socket } = buildSocket();
		seed(socket, 'stream-room-messages', ['rid-1'], 'ddp-1');
		seed(socket, 'stream-room-messages', ['rid-2'], 'ddp-2');

		for (let cycle = 0; cycle < 3; cycle += 1) {
			socket.subscribeAll();
			socket.subscribe('stream-room-messages', ['rid-1']);
			socket.subscribe('stream-room-messages', ['rid-2']);
		}

		expect(Object.keys(socket.subscriptions)).toHaveLength(2);
	});
});

describe('Socket.checkAndReopen bucket dispatch', () => {
	const buildWithSpies = () => {
		const { socket } = buildSocket();
		const { ping } = socket.config;
		const forceReopen = jest.fn();
		const probe = jest.fn();
		socket.forceReopen = forceReopen;
		socket.probe = probe;
		return { socket, forceReopen, probe, ping };
	};

	it('stale (elapsed > ping*2) calls forceReopen and skips probe', async () => {
		const { socket, forceReopen, probe, ping } = buildWithSpies();
		socket.lastPing = Date.now() - ping * 2 - 1000;
		await socket.checkAndReopen();
		expect(forceReopen).toHaveBeenCalledTimes(1);
		expect(probe).not.toHaveBeenCalled();
	});

	it('fresh (elapsed < 2000ms) is a no-op', async () => {
		const { socket, forceReopen, probe } = buildWithSpies();
		socket.lastPing = Date.now() - 500;
		await socket.checkAndReopen();
		expect(forceReopen).not.toHaveBeenCalled();
		expect(probe).not.toHaveBeenCalled();
	});

	it('gray-zone with successful probe does not call forceReopen', async () => {
		const { socket, forceReopen, probe } = buildWithSpies();
		probe.mockResolvedValue(true);
		socket.lastPing = Date.now() - 5000;
		await socket.checkAndReopen();
		expect(probe).toHaveBeenCalledTimes(1);
		expect(forceReopen).not.toHaveBeenCalled();
	});

	it('gray-zone with failed probe calls forceReopen', async () => {
		const { socket, forceReopen, probe } = buildWithSpies();
		probe.mockResolvedValue(false);
		socket.lastPing = Date.now() - 5000;
		await socket.checkAndReopen();
		expect(probe).toHaveBeenCalledTimes(1);
		expect(forceReopen).toHaveBeenCalledTimes(1);
	});

	it('stale and probe-fail buckets resolve only after forceReopen resolves', async () => {
		const tryBucket = async (setup: (s: any) => void) => {
			const { socket } = buildSocket();
			let resolveReopen: () => void = () => undefined;
			const reopenPromise = new Promise<void>(res => {
				resolveReopen = res;
			});
			socket.forceReopen = jest.fn(() => reopenPromise);
			socket.probe = jest.fn().mockResolvedValue(false);
			setup(socket);
			let settled = false;
			const p = socket.checkAndReopen().then(() => {
				settled = true;
			});
			await Promise.resolve();
			await Promise.resolve();
			expect(settled).toBe(false);
			resolveReopen();
			await p;
			expect(settled).toBe(true);
		};

		await tryBucket(socket => {
			socket.lastPing = Date.now() - socket.config.ping * 2 - 1000;
		});
		await tryBucket(socket => {
			socket.lastPing = Date.now() - 5000;
		});
	});
});
