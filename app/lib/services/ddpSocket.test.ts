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
});
