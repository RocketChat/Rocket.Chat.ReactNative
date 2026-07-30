import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { useCallStore } from './useCallStore';
import { terminateNativeCall } from './terminateNativeCall';
import { waitForLoginReady } from '../waitForLoginReady';
import sdk from '../sdk';

const mockWaitForLoginReady = waitForLoginReady as jest.MockedFunction<typeof waitForLoginReady>;
const mockGetState = useCallStore.getState as jest.Mock;
const mockTerminateNativeCall = terminateNativeCall as jest.Mock;
const mockDdp = () => sdk.current?.ddp as any;

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: jest.fn()
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		current: { ddp: {} }
	}
}));

jest.mock('../waitForLoginReady', () => ({
	...jest.requireActual('../waitForLoginReady'),
	waitForLoginReady: jest.fn()
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

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

function makeDdp(overrides: Record<string, unknown> = {}) {
	return {
		reopenNow: jest.fn(() => Promise.resolve()),
		probe: jest.fn(() => Promise.resolve(true)),
		lastPing: Date.now(),
		pingInterval: 10000,
		waitForNotifyUserMediaSubs: jest.fn(() => Promise.resolve(true)),
		...overrides
	};
}

function makeStoreState(overrides: Record<string, unknown> = {}) {
	return {
		call: null,
		resetNativeCallId: jest.fn(),
		...overrides
	};
}

describe('acceptNativeCallWithReadiness', () => {
	const CALL_ID = 'call-uuid';

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		(sdk as any).current = { ddp: makeDdp() };
		mockDdp().lastPing = Date.now();
		mockDdp().pingInterval = 10000;
		mockWaitForLoginReady.mockResolvedValue(true);
		mockGetState.mockReturnValue(makeStoreState());
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('probes a young-ping socket instead of trusting it, and skips reopen when the probe answers', async () => {
		const mediaSession = makeMediaSession();
		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockDdp().probe).toHaveBeenCalledWith(2000);
		expect(mockDdp().reopenNow).not.toHaveBeenCalled();
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});

	it('reopens a young-ping socket when the probe gets no answer', async () => {
		mockDdp().probe = jest.fn(() => Promise.resolve(false));
		const mediaSession = makeMediaSession();

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockDdp().probe).toHaveBeenCalledWith(2000);
		expect(mockDdp().reopenNow).toHaveBeenCalledTimes(1);
		expect(mockWaitForLoginReady.mock.invocationCallOrder[0]).toBeGreaterThan(mockDdp().reopenNow.mock.invocationCallOrder[0]);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});

	it('reopens before waiting when the socket is older than two ping intervals', async () => {
		mockDdp().lastPing = Date.now() - 25000;
		mockDdp().pingInterval = 10000;
		const mediaSession = makeMediaSession();

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockDdp().reopenNow).toHaveBeenCalledTimes(1);
		expect(mockWaitForLoginReady.mock.invocationCallOrder[0]).toBeGreaterThan(mockDdp().reopenNow.mock.invocationCallOrder[0]);
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalled();
	});

	it('falls back to config.ping when pingInterval is missing', async () => {
		// Only a 30s config.ping keeps a 25s-old ping on the probe branch instead of reopening.
		mockDdp().lastPing = Date.now() - 25000;
		mockDdp().pingInterval = undefined;
		mockDdp().config = { ping: 30000 };
		const mediaSession = makeMediaSession();

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockDdp().probe).toHaveBeenCalledWith(2000);
		expect(mockDdp().reopenNow).not.toHaveBeenCalled();
	});

	it('terminates and ends the call when login readiness times out', async () => {
		mockWaitForLoginReady.mockResolvedValue(false);
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mediaSession.applyRestStateSignals).not.toHaveBeenCalled();
	});

	it('terminates and ends the call when media-subscription ack times out', async () => {
		mockDdp().waitForNotifyUserMediaSubs = jest.fn(() => Promise.resolve(false));
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mediaSession.applyRestStateSignals).not.toHaveBeenCalled();
	});

	it('terminates and ends the call when the media session is not initialized', async () => {
		const mediaSession = makeMediaSession({ isInitialized: jest.fn(() => false) });
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mediaSession.applyRestStateSignals).not.toHaveBeenCalled();
	});

	it('terminates and ends the call when the SDK socket is unavailable', async () => {
		(sdk as any).current = {};
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
	});

	it('does not call answerCall when applyRestStateSignals already answered', async () => {
		const mediaSession = makeMediaSession();
		mockGetState.mockReturnValue(makeStoreState({ call: { callId: CALL_ID } }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).not.toHaveBeenCalled();
	});

	it('aborts the previous gate for the same callId and lets the new gate succeed', async () => {
		mockWaitForLoginReady.mockImplementation((_timeoutMs, signal) => Promise.resolve(!signal?.aborted));

		const firstSession = makeMediaSession();
		const secondSession = makeMediaSession();

		const first = acceptNativeCallWithReadiness(CALL_ID, firstSession);
		const second = acceptNativeCallWithReadiness(CALL_ID, secondSession);

		await Promise.all([first, second]);

		expect(firstSession.applyRestStateSignals).not.toHaveBeenCalled();
		expect(firstSession.endCall).not.toHaveBeenCalled();
		expect(firstSession.answerCall).not.toHaveBeenCalled();
		expect(secondSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(secondSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});

	it('does not terminate or end the call when an aborted gate finishes', async () => {
		mockWaitForLoginReady.mockImplementation((_timeoutMs, signal) => Promise.resolve(!signal?.aborted));

		const firstSession = makeMediaSession();
		const secondSession = makeMediaSession();

		const first = acceptNativeCallWithReadiness(CALL_ID, firstSession);
		const second = acceptNativeCallWithReadiness(CALL_ID, secondSession);

		await Promise.all([first, second]);

		expect(mockTerminateNativeCall).not.toHaveBeenCalledWith(CALL_ID);
		expect(firstSession.endCall).not.toHaveBeenCalled();
		expect(secondSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});

	it('keeps the newer gate entry when an older gate cleans up, so a third gate aborts the newer one', async () => {
		let gateIndex = 0;
		mockWaitForLoginReady.mockImplementation((_timeoutMs, signal) => {
			const myIndex = ++gateIndex;
			if (signal?.aborted) {
				return Promise.resolve(false);
			}
			return new Promise(resolve => {
				setTimeout(() => resolve(true), myIndex * 1000);
			});
		});

		const firstSession = makeMediaSession();
		const secondSession = makeMediaSession();
		const thirdSession = makeMediaSession();

		const first = acceptNativeCallWithReadiness(CALL_ID, firstSession);
		const second = acceptNativeCallWithReadiness(CALL_ID, secondSession);

		await Promise.resolve();
		await Promise.resolve();

		const third = acceptNativeCallWithReadiness(CALL_ID, thirdSession);

		await jest.advanceTimersByTimeAsync(3000);

		await Promise.all([first, second, third]);

		expect(firstSession.endCall).not.toHaveBeenCalled();
		expect(secondSession.answerCall).not.toHaveBeenCalled();
		expect(thirdSession.answerCall).toHaveBeenCalledWith(CALL_ID);
	});
});
