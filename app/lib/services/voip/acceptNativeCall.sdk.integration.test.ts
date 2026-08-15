import sdk from '../sdk';
import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { useCallStore } from './useCallStore';
import { terminateNativeCall } from './terminateNativeCall';
import { waitForLoginReady } from '../waitForLoginReady';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DDPDriver } = require('@rocket.chat/sdk/lib/drivers/ddp') as {
	DDPDriver: new (options: { host: string; logger: unknown }) => PatchedDriver;
};

jest.mock('../sdk', () => ({
	__esModule: true,
	default: { current: undefined }
}));

jest.mock('./useCallStore', () => ({
	useCallStore: { getState: jest.fn() }
}));

jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: jest.fn()
}));

jest.mock('../waitForLoginReady', () => ({
	waitForLoginReady: jest.fn()
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

interface MockConnection {
	send: jest.Mock;
	close: jest.Mock;
	readyState: number;
	onopen: () => void;
	onmessage: (event: { data: string }) => void;
	onerror: () => void;
	onclose: () => void;
}

interface PatchedDriver {
	userId: string;
	pingInterval: number;
	reopenNow(): Promise<void>;
	ddp: {
		lastPing: number;
		pingTimeout?: ReturnType<typeof setTimeout>;
		openTimeout?: ReturnType<typeof setTimeout>;
		open(): Promise<void>;
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
				} else if (message.msg === 'unsub') {
					setImmediate(() => connection.onmessage({ data: JSON.stringify({ msg: 'nosub', id: message.id }) }));
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

const mockWaitForLoginReady = waitForLoginReady as jest.MockedFunction<typeof waitForLoginReady>;
const mockGetState = useCallStore.getState as jest.Mock;
const mockTerminateNativeCall = terminateNativeCall as jest.Mock;

const CALL_ID = 'call-uuid';
const USER_ID = 'user-id';
const PING_INTERVAL = 10000;

const logger = { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() };

interface IMediaSession {
	applyRestStateSignals: jest.Mock<Promise<void>>;
	answerCall: jest.Mock<Promise<void>, [string]>;
	endCall: jest.Mock<void, [string]>;
	isInitialized: jest.Mock<boolean>;
}

function makeMediaSession(overrides: Partial<IMediaSession> = {}): IMediaSession {
	return {
		applyRestStateSignals: jest.fn<Promise<void>, []>(() => Promise.resolve()),
		answerCall: jest.fn<Promise<void>, [string]>(() => Promise.resolve()),
		endCall: jest.fn<void, [string]>(),
		isInitialized: jest.fn<boolean, []>(() => true),
		...overrides
	};
}

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

let driver: PatchedDriver;

beforeEach(async () => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockConnections.length = 0;
	driver = await buildConnectedDriver();
	(sdk as unknown as { current: { ddp: PatchedDriver } }).current = { ddp: driver };
	mockWaitForLoginReady.mockResolvedValue(true);
	mockGetState.mockReturnValue({ call: null, resetNativeCallId: jest.fn() });
});

afterEach(() => {
	if (driver.ddp.pingTimeout) clearTimeout(driver.ddp.pingTimeout);
	if (driver.ddp.openTimeout) clearTimeout(driver.ddp.openTimeout);
	jest.useRealTimers();
});

describe('acceptNativeCallWithReadiness against the real patched socket', () => {
	it('answers the call once media subs re-ack on the reopened socket', async () => {
		const mediaSession = makeMediaSession();

		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);

		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);
		await jest.advanceTimersByTimeAsync(200);
		await accept;

		expect(mockWaitForLoginReady).toHaveBeenCalledTimes(1);
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		expect(mediaSession.endCall).not.toHaveBeenCalled();
	});

	it('fails the call without answering when the reopened socket never acks the re-sub', async () => {
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue({ call: null, resetNativeCallId });

		backdateLastPing(driver, PING_INTERVAL * 3);
		addMediaSubs(driver);

		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();

		// Swallow the re-sub frames before the reopen handshake settles, so the
		// media ack never arrives while the connect handshake still completes.
		mockConnections[1].send.mockImplementation(() => undefined);
		await jest.advanceTimersByTimeAsync(0);
		await jest.advanceTimersByTimeAsync(8000);
		await accept;

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mediaSession.answerCall).not.toHaveBeenCalled();
		expect(mediaSession.applyRestStateSignals).not.toHaveBeenCalled();
	});

	it('answers when the media subs only appear after the reopen', async () => {
		const mediaSession = makeMediaSession();

		backdateLastPing(driver, PING_INTERVAL * 3);

		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(0);

		// No media subs registered yet, so the wait polls instead of resolving.
		await jest.advanceTimersByTimeAsync(100);

		// The subs appear after the poll is already underway.
		addMediaSubs(driver);
		await jest.advanceTimersByTimeAsync(200);
		await accept;

		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});
});
