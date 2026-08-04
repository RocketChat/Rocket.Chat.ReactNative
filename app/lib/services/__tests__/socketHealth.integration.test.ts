import sdk from '../sdk';
import { classifySocketHealth, recoverSocket } from '../socketHealth';

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
	lastPing: number;
	reopenNow(): Promise<void>;
	probe(timeoutMs: number): Promise<boolean>;
	waitForNotifyUserMediaSubs(timeoutMs?: number): Promise<boolean>;
	ddp: {
		lastPing: number;
		lastPongAt: number;
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
					// A DDP server echoes the ping's id on its pong, which is what lets the
					// round-trip check tell its own answer from an unrelated frame.
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'pong', id: message.id }) }));
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

/**
 * Age the socket's heartbeat. Both timestamps move: `lastPing` is what any inbound
 * frame refreshes, `lastPongAt` is what the health classification ages against.
 */
function backdateHeartbeat(driver: PatchedDriver, ageMs: number) {
	driver.ddp.lastPing = Date.now() - ageMs;
	driver.ddp.lastPongAt = Date.now() - ageMs;
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
		backdateHeartbeat(driver, PING_INTERVAL + 5000);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('confirmed-alive');
		// The round trip pinged the existing socket and the pong kept it alive.
		expect(framesOn(mockConnections[0], 'ping').length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(1);
	});

	it('reopens a doubtful socket when the round trip gets no pong', async () => {
		backdateHeartbeat(driver, PING_INTERVAL + 5000);
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
		backdateHeartbeat(driver, PING_INTERVAL * 2 + 1000);

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
		backdateHeartbeat(driver, PING_INTERVAL * 3);

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
		backdateHeartbeat(driver, PING_INTERVAL * 3);

		const recovery = recoverSocket();
		await jest.advanceTimersByTimeAsync(0);
		await inFlight;
		expect(rejected).toBe(true);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		await expect(recovery).resolves.toBe('reopened');
	});

	/**
	 * The Android-freeze case: the process is frozen past the ping deadline and the server
	 * drops the session, then the OS flushes the frames buffered during the freeze. Those
	 * frames must not vouch for a session that is already gone — if the socket is not
	 * reopened, no `close` and no `connecting` are emitted, the resume login never runs,
	 * and the server-side streams stay dead for the rest of the session.
	 *
	 * Each test isolates one way a flushed frame used to be mistaken for liveness.
	 */
	describe('a frozen socket whose buffered frames are flushed on resume', () => {
		/** A frame that arrived during the freeze and is only delivered on resume. */
		const flush = (frame: Record<string, unknown>) => {
			mockConnections[0].onmessage({ data: JSON.stringify(frame) });
		};

		beforeEach(() => {
			// The server dropped this session during the freeze: nothing we send is answered.
			mockConnections[0].send.mockImplementation(() => undefined);
			addMediaSubs(driver);
		});

		it('does not let a flushed data frame make a long-frozen socket look young', async () => {
			backdateHeartbeat(driver, 170_000);

			// The message the other user sent while we were frozen, delivered on resume.
			// It refreshes `lastPing`, which is why the classification cannot age against it.
			flush({ msg: 'changed', collection: 'stream-room-messages', fields: { args: [{ _id: 'm1' }] } });

			expect(classifySocketHealth(driver)).toBe('reopen');

			const recovery = recoverSocket();
			await jest.advanceTimersByTimeAsync(0);

			// Straight to a reopen: a socket this old is not worth a round trip.
			expect(mockConnections).toHaveLength(2);
			expect(framesOn(mockConnections[0], 'ping')).toHaveLength(0);
			mockConnections[1].onopen();
			await jest.advanceTimersByTimeAsync(0);
			await expect(recovery).resolves.toBe('reopened');
		});

		it('does not accept a pong that is not the answer to the round trip', async () => {
			// In the gray zone, so recovery pays for a round trip rather than reopening blind.
			backdateHeartbeat(driver, PING_INTERVAL + 5000);
			expect(classifySocketHealth(driver)).toBe('round-trip-check');

			const recovery = recoverSocket();
			// The OS drains the receive buffer over several ms, so the round trip is already
			// waiting when the rest of the backlog lands.
			await jest.advanceTimersByTimeAsync(50);

			// A pong buffered before the freeze — the answer to the periodic ping the ping
			// loop sent on its way down, carrying no id, not the answer to our round trip.
			flush({ msg: 'pong' });
			await jest.advanceTimersByTimeAsync(2000);

			expect(mockConnections).toHaveLength(2);
			mockConnections[1].onopen();
			await jest.advanceTimersByTimeAsync(0);
			await expect(recovery).resolves.toBe('reopened');
		});

		it('does not accept a pong answering a different round trip', async () => {
			backdateHeartbeat(driver, PING_INTERVAL + 5000);

			const recovery = recoverSocket();
			await jest.advanceTimersByTimeAsync(50);

			// An id-carrying pong, but for a different probe — a real possibility once an
			// earlier round trip has timed out and its ping is answered late. This round
			// trip is `probe-0`, the first on this socket.
			flush({ msg: 'pong', id: 'probe-7' });
			await jest.advanceTimersByTimeAsync(2000);

			expect(mockConnections).toHaveLength(2);
			mockConnections[1].onopen();
			await jest.advanceTimersByTimeAsync(0);
			await expect(recovery).resolves.toBe('reopened');
		});
	});

	it('re-sends the media subscriptions on the new socket reusing their ids', async () => {
		backdateHeartbeat(driver, PING_INTERVAL * 3);
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
