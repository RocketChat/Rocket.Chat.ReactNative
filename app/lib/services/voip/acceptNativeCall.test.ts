import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { useCallStore } from './useCallStore';
import { terminateNativeCall } from './terminateNativeCall';
import { waitForLoginReady } from '../waitForLoginReady';
import { recoverSocket } from '../socketHealth';

const mockWaitForLoginReady = waitForLoginReady as jest.MockedFunction<typeof waitForLoginReady>;
const mockRecoverSocket = recoverSocket as jest.MockedFunction<typeof recoverSocket>;
const mockGetState = useCallStore.getState as jest.Mock;
const mockTerminateNativeCall = terminateNativeCall as jest.Mock;

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: jest.fn()
}));

jest.mock('../socketHealth', () => ({
	recoverSocket: jest.fn()
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
		mockRecoverSocket.mockResolvedValue('confirmed-alive');
		mockWaitForLoginReady.mockResolvedValue(true);
		mockGetState.mockReturnValue(makeStoreState());
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it.each(['confirmed-alive', 'reopened'] as const)(
		'waits for readiness and answers the call when socket recovery reports %s',
		async outcome => {
			mockRecoverSocket.mockResolvedValue(outcome);
			const mediaSession = makeMediaSession();

			await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

			expect(mockRecoverSocket).toHaveBeenCalledTimes(1);
			expect(mockRecoverSocket.mock.calls[0][0]?.abortSignal).toBeDefined();
			expect(mockWaitForLoginReady.mock.invocationCallOrder[0]).toBeGreaterThan(mockRecoverSocket.mock.invocationCallOrder[0]);
			expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
			expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		}
	);

	it('terminates and ends the call when there is no socket to recover', async () => {
		mockRecoverSocket.mockResolvedValue('no-socket');
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockWaitForLoginReady).not.toHaveBeenCalled();
	});

	it('returns silently without terminating when socket recovery reports the gate abandoned', async () => {
		mockRecoverSocket.mockResolvedValue('abandoned');
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		expect(resetNativeCallId).not.toHaveBeenCalled();
		expect(mediaSession.endCall).not.toHaveBeenCalled();
		expect(mediaSession.applyRestStateSignals).not.toHaveBeenCalled();
		expect(mockWaitForLoginReady).not.toHaveBeenCalled();
	});

	it('terminates and ends the call when socket recovery throws', async () => {
		mockRecoverSocket.mockRejectedValue(new Error('reopen failed'));
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue(makeStoreState({ resetNativeCallId }));

		await acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
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
