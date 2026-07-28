import type { Store } from 'redux';

import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';
import { initStore } from '../../store/auxStore';
import sdk from '../sdk';
import type { IApplicationState } from '../../../definitions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DDPDriver } = require('@rocket.chat/sdk/lib/drivers/ddp');

const mockConnections: any[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const connection = {
			send: jest.fn((data: string) => {
				const message = JSON.parse(data);
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

jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: jest.fn()
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: { current: undefined }
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const USER_ID = 'user-id';
const CALL_ID = 'call-uuid';
const PING_INTERVAL = 20000;

const mockTerminateNativeCall = terminateNativeCall as jest.Mock;
const mockGetCallState = useCallStore.getState as jest.Mock;

interface IMediaSession {
	applyRestStateSignals: jest.Mock<Promise<void>, []>;
	answerCall: jest.Mock<Promise<void>, [string]>;
	endCall: jest.Mock<void, [string]>;
	isInitialized: jest.Mock<boolean, []>;
}

function makeMediaSession(): IMediaSession {
	return {
		applyRestStateSignals: jest.fn<Promise<void>, []>(() => Promise.resolve()),
		answerCall: jest.fn<Promise<void>, [string]>(() => Promise.resolve()),
		endCall: jest.fn<void, [string]>(),
		isInitialized: jest.fn<boolean, []>(() => true)
	};
}

/**
 * Minimal redux surface so `waitForLoginReady` runs for real: it reads
 * `login.isAuthenticated` / `meteor.connected` and subscribes for changes.
 */
function makeReduxStore() {
	const listeners = new Set<() => void>();
	const state = { login: { isAuthenticated: false }, meteor: { connected: false } };
	return {
		listenerCount: () => listeners.size,
		setLoginReady: () => {
			state.login.isAuthenticated = true;
			state.meteor.connected = true;
			listeners.forEach(listener => listener());
		},
		store: {
			getState: () => state,
			subscribe: (listener: () => void) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			}
		} as unknown as Store<IApplicationState>
	};
}

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

function addMediaSubs(driver: any) {
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

function backdateLastPing(driver: any, ageMs: number) {
	driver.ddp.lastPing = Date.now() - ageMs;
}

/** Sub messages sent over the wire, across every connection the socket opened. */
function subMessages() {
	return mockConnections
		.flatMap(connection => connection.send.mock.calls.map(([data]: [string]) => JSON.parse(data)))
		.filter(message => message.msg === 'sub');
}

describe('acceptNativeCallWithReadiness with the real patched socket', () => {
	let redux: ReturnType<typeof makeReduxStore>;
	let driver: any;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockConnections.length = 0;
		redux = makeReduxStore();
		initStore(redux.store);
		mockGetCallState.mockReturnValue({ call: null, resetNativeCallId: jest.fn() });
		driver = await buildConnectedDriver();
		(sdk as any).current = { ddp: driver };
	});

	afterEach(() => {
		if (driver.ddp.pingTimeout) clearTimeout(driver.ddp.pingTimeout);
		if (driver.ddp.openTimeout) clearTimeout(driver.ddp.openTimeout);
		jest.useRealTimers();
	});

	it('exposes the ping interval the health classification depends on', () => {
		expect(driver.pingInterval).toBe(PING_INTERVAL);
	});

	it('reopens a dead socket, waits for readiness, then answers the call', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		// The gate reopens before it starts waiting, so a second connection is created.
		await jest.advanceTimersByTimeAsync(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();

		redux.setLoginReady();
		await jest.advanceTimersByTimeAsync(200);
		await gate;

		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		// Both media subs were re-sent on the new socket reusing their ids.
		expect(subMessages()).toEqual([
			expect.objectContaining({ id: 'sub-0', name: 'stream-notify-user', params: [`${USER_ID}/media-signal`] }),
			expect.objectContaining({ id: 'sub-1', name: 'stream-notify-user', params: [`${USER_ID}/media-calls`] })
		]);
	});

	it('releases its store listener and readiness polling as soon as readiness lands', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(200);
		await gate;

		expect(redux.listenerCount()).toBe(0);
		const subsAfterGate = subMessages().length;

		// Nothing is left scheduled: no late resubscribe, no late failure ladder.
		await jest.advanceTimersByTimeAsync(60000);
		expect(subMessages()).toHaveLength(subsAfterGate);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		expect(mediaSession.endCall).not.toHaveBeenCalled();
	});

	it('runs the failure ladder once and leaves nothing behind when readiness never lands', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);
		const resetNativeCallId = jest.fn();
		mockGetCallState.mockReturnValue({ call: null, resetNativeCallId });
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();

		// Login never authenticates and the media subs never appear.
		await jest.advanceTimersByTimeAsync(8000);
		await gate;

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalledTimes(1);
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mediaSession.answerCall).not.toHaveBeenCalled();
		expect(redux.listenerCount()).toBe(0);

		await jest.advanceTimersByTimeAsync(60000);
		expect(mockTerminateNativeCall).toHaveBeenCalledTimes(1);
		expect(mediaSession.endCall).toHaveBeenCalledTimes(1);
	});

	it('keeps a gray-zone socket when the probe gets a pong', async () => {
		backdateLastPing(driver, PING_INTERVAL + 5000);
		addMediaSubs(driver);
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(200);
		await gate;

		// The probe pinged the existing socket and the pong kept it alive.
		const pings = mockConnections[0].send.mock.calls.filter(([data]: [string]) => JSON.parse(data).msg === 'ping');
		expect(pings.length).toBeGreaterThan(0);
		expect(mockConnections).toHaveLength(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});

	it('reopens a gray-zone socket when the probe gets no pong', async () => {
		backdateLastPing(driver, PING_INTERVAL + 5000);
		// A zombie socket: still `readyState: 1`, but the server never answers.
		mockConnections[0].send.mockImplementation(() => undefined);
		addMediaSubs(driver);
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(2000);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();

		await jest.advanceTimersByTimeAsync(200);
		await gate;

		// The probe was actually attempted on the dead socket before reopening.
		const pings = mockConnections[0].send.mock.calls.filter(([data]: [string]) => JSON.parse(data).msg === 'ping');
		expect(pings.length).toBeGreaterThan(0);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});

	it('reopens without probing when the socket is older than two ping intervals', async () => {
		backdateLastPing(driver, PING_INTERVAL * 2 + 1000);
		addMediaSubs(driver);
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);

		expect(mockConnections).toHaveLength(2);
		// No raw probe ping was sent on the dead socket.
		const pings = mockConnections[0].send.mock.calls.filter(([data]: [string]) => JSON.parse(data).msg === 'ping');
		expect(pings).toHaveLength(0);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(200);
		await gate;

		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});

	it('shares a single reopen between the accept gate and a concurrent foreground reopen', async () => {
		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		// The foreground saga reopens the stale socket while the gate does the same.
		const foregroundReopen = driver.reopenNow();
		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		await jest.advanceTimersByTimeAsync(0);
		expect(mockConnections).toHaveLength(2);
		mockConnections[1].onopen();

		await jest.advanceTimersByTimeAsync(200);
		await Promise.all([foregroundReopen, gate]);

		expect(mockConnections).toHaveLength(2);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);

		// No queued third open fires later — the reopen really was shared.
		await jest.advanceTimersByTimeAsync(60000);
		expect(mockConnections).toHaveLength(2);
	});

	it('rejects an in-flight DDP method call when the gate reopens the socket', async () => {
		let rejected = false;
		const inFlight = driver.ddp.send({ msg: 'method', method: 'getRoomByTypeAndName', params: [] }).catch(() => {
			rejected = true;
		});
		await jest.advanceTimersByTimeAsync(0);
		expect(rejected).toBe(false);

		// The socket dies silently after the call went out.
		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		await inFlight;
		expect(rejected).toBe(true);

		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(200);
		await gate;

		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});
});
