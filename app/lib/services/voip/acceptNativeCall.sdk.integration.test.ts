import sdk from '../sdk';
import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { useCallStore } from './useCallStore';
import { terminateNativeCall } from './terminateNativeCall';
import { waitForLoginReady } from '../waitForLoginReady';
import { connectAuthenticatedSdk, createTransportFake, subscribeMediaStreams } from '../../testUtils/sdkTransport';
import type { FakeConnection, RealSdkClient } from '../../testUtils/sdkTransport';
import type { ISdkModuleFake } from '../../testUtils/sdkModuleFake';

const mockTransport = createTransportFake();

jest.mock('../sdk', () => {
	const { createSdkModuleFake } = jest.requireActual('../../testUtils/sdkModuleFake');
	return { __esModule: true, default: createSdkModuleFake() };
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

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('universal-websocket-client', () => jest.fn().mockImplementation(() => mockTransport.createConnection()));

const mockWaitForLoginReady = waitForLoginReady as jest.MockedFunction<typeof waitForLoginReady>;
const mockGetState = useCallStore.getState as jest.Mock;
const mockTerminateNativeCall = terminateNativeCall as jest.Mock;
const sdkModule = sdk as unknown as ISdkModuleFake;

const CALL_ID = 'call-uuid';
const USER_ID = 'user-id';
const MEDIA_STREAMS = ['media-signal', 'media-calls'];
const READINESS_TIMEOUT = 8000;

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

function mediaSubIdsOn(connection: FakeConnection): (string | undefined)[] {
	const sent = mockTransport.frames({ msg: 'sub', name: 'stream-notify-user' }, connection);
	return MEDIA_STREAMS.map(stream => sent.find(frame => frame.params?.[0] === `${USER_ID}/${stream}`)?.id);
}

let client: RealSdkClient;

beforeEach(async () => {
	jest.clearAllMocks();
	mockTransport.reset();
	client = await connectAuthenticatedSdk(mockTransport);
	sdkModule.setClient(client);
	mockWaitForLoginReady.mockResolvedValue(true);
	mockGetState.mockReturnValue({ call: null, resetNativeCallId: jest.fn() });
});

afterEach(async () => {
	await client.disconnect();
	sdkModule.setClient(null);
	jest.useRealTimers();
});

describe('acceptNativeCallWithReadiness against the real SDK socket', () => {
	it('replays the media subscription ids onto the reopened socket and answers the call', async () => {
		await subscribeMediaStreams(client);
		const originalIds = mediaSubIdsOn(mockTransport.connections[0]);
		expect(originalIds).toEqual([expect.any(String), expect.any(String)]);
		const mediaSession = makeMediaSession();

		const reopened = mockTransport.awaitConnection(1);
		mockTransport.closeTransport(mockTransport.connections[0]);
		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		mockTransport.open(await reopened);
		await accept;

		expect(mediaSubIdsOn(mockTransport.connections[1])).toEqual(originalIds);
		expect(mockWaitForLoginReady).toHaveBeenCalledTimes(1);
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		expect(mediaSession.endCall).not.toHaveBeenCalled();
	});

	it('fails the call without answering when the reopened socket never acks the replayed subscriptions', async () => {
		await subscribeMediaStreams(client);
		const resetNativeCallId = jest.fn();
		mockGetState.mockReturnValue({ call: null, resetNativeCallId });
		const mediaSession = makeMediaSession();

		jest.useFakeTimers();
		mockTransport.withhold({ msg: 'sub' });

		const reopened = mockTransport.awaitConnection(1);
		mockTransport.closeTransport(mockTransport.connections[0]);
		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		mockTransport.open(await reopened);
		await mockTransport.awaitFrame({ msg: 'sub' }, mockTransport.connections[1]);
		await jest.advanceTimersByTimeAsync(READINESS_TIMEOUT);
		await accept;

		expect(mockTerminateNativeCall).toHaveBeenCalledWith(CALL_ID);
		expect(resetNativeCallId).toHaveBeenCalled();
		expect(mediaSession.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(mediaSession.answerCall).not.toHaveBeenCalled();
		expect(mediaSession.applyRestStateSignals).not.toHaveBeenCalled();
	});

	it('answers when the media subscriptions are only created after the reopen', async () => {
		const mediaSession = makeMediaSession();

		jest.useFakeTimers();

		const reopened = mockTransport.awaitConnection(1);
		mockTransport.closeTransport(mockTransport.connections[0]);
		const accept = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		const connection = await reopened;
		mockTransport.open(connection);
		await subscribeMediaStreams(client);

		await jest.advanceTimersByTimeAsync(200);
		await accept;

		expect(mediaSubIdsOn(connection)).toEqual([expect.any(String), expect.any(String)]);
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});
});
