import sdk from '../sdk';
import { recoverSocket } from '../socketHealth';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DDPDriver } = require('@rocket.chat/sdk/lib/drivers/ddp') as {
	DDPDriver: new (options: { host: string; logger: unknown }) => PatchedDriver;
};

interface MockConnection {
	send: jest.Mock;
	close: jest.Mock;
	readyState: number;
	onopen: () => void;
	onmessage: (event: { data: string }) => void;
	onerror: () => void;
	onclose: () => void;
}

interface WireFrame {
	msg: string;
	id?: string;
	name?: string;
	params?: string[];
}

interface PatchedDriver {
	userId: string;
	pingInterval: number;
	reopenNow(): Promise<void>;
	waitForNotifyUserMediaSubs(timeoutMs?: number): Promise<boolean>;
	ddp: {
		lastPing: number;
		pingTimeout?: ReturnType<typeof setTimeout>;
		openTimeout?: ReturnType<typeof setTimeout>;
		open(): Promise<void>;
		send(message: Record<string, unknown>): Promise<unknown>;
		subscriptions: Record<string, { id: string; name: string; params: string[]; unsubscribe: jest.Mock }>;
	};
}

const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const connection = {
			send: jest.fn((data: string) => {
				const message = JSON.parse(data) as { msg: string; id?: string };
				if (message.msg === 'connect') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'connected', session: 'session-id' }) }));
				} else if (message.msg === 'ping') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'pong' }) }));
				} else if (message.msg === 'sub') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'ready', subs: [message.id] }) }));
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
	})
);

jest.mock('../sdk', () => ({
	__esModule: true,
	default: { current: undefined }
}));

const USER_ID = 'user-id';
const PING_INTERVAL = 10000;

const logger = { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() };

/** Real patched DDPDriver over a mocked WebSocket, connected and logged in. */
async function buildConnectedDriver() {
	const driver = new DDPDriver({ host: 'localhost:3000', logger });
	driver.userId = USER_ID;
	const openPromise = driver.ddp.open();
	mockConnections[0].onopen();
	await jest.advanceTimersByTimeAsync(0);
	await openPromise;
	return driver;
}

function addMediaSubs(driver: PatchedDriver) {
	['media-signal', 'media-calls'].forEach((name, index) => {
		const id = `sub-${index}`;
		driver.ddp.subscriptions[id] = {
			id,
			name: 'stream-notify-user',
			params: [`${USER_ID}/${name}`],
			unsubscribe: jest.fn()
		};
	});
}

function backdateLastPing(driver: PatchedDriver, ageMs: number) {
	driver.ddp.lastPing = Date.now() - ageMs;
}

/** Frames of a given `msg` sent over the wire on one connection. */
function framesOn(connection: MockConnection, msg: string) {
	return connection.send.mock.calls
		.map(([data]: [string]) => JSON.parse(data) as WireFrame)
		.filter(message => message.msg === msg);
}

describe('recoverSocket against the real patched socket', () => {
	let driver: PatchedDriver;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockConnections.length = 0;
		driver = await buildConnectedDriver();
		(sdk as unknown as { current: { ddp: PatchedDriver } }).current = { ddp: driver };
	});

	afterEach(() => {
		if (driver.ddp.pingTimeout) clearTimeout(driver.ddp.pingTimeout);
		if (driver.ddp.openTimeout) clearTimeout(driver.ddp.openTimeout);
		jest.useRealTimers();
	});

	it('exposes the ping interval the health classification depends on', () => {
		expect(driver.pingInterval).toBe(PING_INTERVAL);
	});

	it('keeps a doubtful socket when the round trip gets a pong', async () => {
		backdateLastPing(driver, PING_INTERVAL + 5000);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('confirmed-alive');
		// The round trip pinged the existing socket and the pong kept it alive.
		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(1);
	});

	it('reopens a doubtful socket when the round trip gets no pong', async () => {
		backdateLastPing(driver, PING_INTERVAL + 5000);
		// A zombie socket: still `readyState: 1`, but the server never answers.
		mockConnections[0].send.mockImplementation(() => undefined);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(2000);

		// The round trip was actually attempted on the dead socket before reopening.
		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('reopens a frozen socket whose last ping is still young', async () => {
		// A young `lastPing` proves nothing: `onOpen` refreshes it before the handshake
		// reply lands, so the timestamp can sit on an unusable session.
		mockConnections[0].send.mockImplementation(() => undefined);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(2000);

		// The young ping bought a round trip, and the silent socket failed it.
		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('reopens a known-dead socket without a round trip', async () => {
		backdateLastPing(driver, PING_INTERVAL * 2 + 1000);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		expect(mockConnections).toHaveLength(2);
		// No raw round-trip ping was sent on the dead socket.
		expect(framesOn(mockConnections[0], 'ping')).toHaveLength(0);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('shares one reopen with a concurrent direct reopenNow', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);

		// The foreground path reopens the dead socket while recovery does the same.
		const directReopen = driver.reopenNow();
		const recovery = recoverSocket();

		await jest.advanceTimersByTimeAsync(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await directReopen;
		await expect(recovery).resolves.toBe('reopened');
		expect(mockConnections).toHaveLength(2);

		// No queued third open fires later — the reopen really was shared.
		await jest.advanceTimersByTimeAsync(60000);
		expect(mockConnections).toHaveLength(2);
	});

	it('rejects an in-flight DDP method call when recovery reopens the socket', async () => {
		let rejected = false;
		const inFlight = driver.ddp.send({ msg: 'method', method: 'getRoomByTypeAndName', params: [] }).catch(() => {
			rejected = true;
		});
		await jest.advanceTimersByTimeAsync(0);
		expect(rejected).toBe(false);

		// The socket dies silently after the call went out.
		backdateLastPing(driver, PING_INTERVAL * 3);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		await inFlight;
		expect(rejected).toBe(true);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	it('re-sends the media subscriptions on the new socket reusing their ids', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);
		await expect(recovery).resolves.toBe('reopened');

		const resubscribed = driver.waitForNotifyUserMediaSubs();
		await jest.advanceTimersByTimeAsync(200);
		await expect(resubscribed).resolves.toBe(true);

		// Both media subs went out on the new socket reusing their ids.
		expect(framesOn(mockConnections[0], 'sub')).toHaveLength(0);
		expect(framesOn(mockConnections[1], 'sub')).toEqual([
			expect.objectContaining({ id: 'sub-0', name: 'stream-notify-user', params: [`${USER_ID}/media-signal`] }),
			expect.objectContaining({ id: 'sub-1', name: 'stream-notify-user', params: [`${USER_ID}/media-calls`] })
		]);
	});
});
