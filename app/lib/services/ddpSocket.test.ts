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
});

describe('Socket.checkAndReopen bucket dispatch', () => {
	const PING = 10000;

	const buildWithSpies = () => {
		const { socket } = buildSocket();
		const forceReopen = jest.fn();
		const probe = jest.fn();
		socket.forceReopen = forceReopen;
		socket.probe = probe;
		return { socket, forceReopen, probe };
	};

	it('stale (elapsed > ping*2) calls forceReopen and skips probe', async () => {
		const { socket, forceReopen, probe } = buildWithSpies();
		socket.lastPing = Date.now() - PING * 2 - 1000;
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
			socket.lastPing = Date.now() - PING * 2 - 1000;
		});
		await tryBucket(socket => {
			socket.lastPing = Date.now() - 5000;
		});
	});
});
