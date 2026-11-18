import sdk from '../sdk';
import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { useCallStore } from './useCallStore';
import { terminateNativeCall } from './terminateNativeCall';
import { waitForLoginReady } from '../waitForLoginReady';
import {
	addMediaSubs,
	backdateLastPing,
	buildConnectedDriver,
	framesOn,
	resumeLogin,
	stopAnsweringFrames
} from '~/lib/testUtils/sdkIntegration';
import type { IMockSdk, MockConnection, IMockSdkDriver } from '~/lib/testUtils/sdkIntegration';
import type * as SdkIntegration from '~/lib/testUtils/sdkIntegration';

jest.mock('../sdk', () => {
	const sdkIntegration = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
	return { __esModule: true, default: sdkIntegration.makeSdkMock() };
});

jest.mock('./useCallStore', () => ({
	useCallStore: { getState: jest.fn() }
}));

jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: jest.fn()
}));

jest.mock('../waitForLoginReady', () => ({
	waitForLoginReady: jest.fn()
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('~/lib/testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

const mockWaitForLoginReady = waitForLoginReady as jest.MockedFunction<typeof waitForLoginReady>;
const mockGetState = useCallStore.getState as jest.Mock;
const mockTerminateNativeCall = terminateNativeCall as jest.Mock;

const CALL_ID = 'call-uuid';
const USER_ID = 'user-id';
const PING_INTERVAL = 10000;

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

let driver: IMockSdkDriver;

beforeEach(async () => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockConnections.length = 0;
	driver = await buildConnectedDriver(mockConnections, USER_ID);
	(sdk as unknown as IMockSdk).setClient({ driver });
	mockWaitForLoginReady.mockResolvedValue(true);
	mockGetState.mockReturnValue({ call: null, resetNativeCallId: jest.fn() });
});

afterEach(() => {
	if (driver.socket.pingTimeout) clearTimeout(driver.socket.pingTimeout);
	if (driver.socket.openTimeout) clearTimeout(driver.socket.openTimeout);
	jest.useRealTimers();
});

describe('acceptNativeCallWithReadiness against the real SDK socket', () => {
	it('answers on a live socket whose media subs were acked, without sending a sub', async () => {
		const mediaSession = makeMediaSession();
		await addMediaSubs(driver, USER_ID);
		const subsBefore = framesOn(mockConnections[0], 'sub').length;

		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		await accept;

		expect(mockConnections).toHaveLength(1);
		expect(framesOn(mockConnections[0], 'sub')).toHaveLength(subsBefore);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});

	it('answers the call once the resume login resubscribes the media subs on the reopened socket', async () => {
		const mediaSession = makeMediaSession();

		await addMediaSubs(driver, USER_ID);
		backdateLastPing(driver, PING_INTERVAL * 3);

		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();
		await jest.advanceTimersByTimeAsync(200);
		expect(mediaSession.answerCall).not.toHaveBeenCalled();

		await resumeLogin(driver);
		await jest.advanceTimersByTimeAsync(200);
		await accept;

		expect(mockWaitForLoginReady).toHaveBeenCalledTimes(1);
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		expect(mediaSession.endCall).not.toHaveBeenCalled();
	});

	it('fails the call without answering when the reopened socket never acks the resubscribe', async () => {
		const mediaSession = makeMediaSession();
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue({ call: null, resetNativeCallId });

		await addMediaSubs(driver, USER_ID);
		backdateLastPing(driver, PING_INTERVAL * 3);

		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(0);
		mockConnections[1].onopen();

		stopAnsweringFrames(mockConnections[1]);
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

		await jest.advanceTimersByTimeAsync(100);

		await addMediaSubs(driver, USER_ID);
		await jest.advanceTimersByTimeAsync(200);
		await accept;

		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});
});
