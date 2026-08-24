import type { Store } from 'redux';

import { acceptNativeCallWithReadiness } from './acceptNativeCall';
import { terminateNativeCall } from './terminateNativeCall';
import { useCallStore } from './useCallStore';
import { initStore } from '../../store/auxStore';
import { recoverSocket } from '../socketHealth';
import sdk from '../sdk';
import { addMediaSubs, buildConnectedDriver } from '../../testUtils/sdkIntegration';
import type { IMockSdk, IMockSdkDriver, MockConnection } from '../../testUtils/sdkIntegration';
import type * as SdkIntegration from '../../testUtils/sdkIntegration';
import type { IApplicationState } from '../../../definitions';

jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: jest.fn()
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('../socketHealth', () => ({
	recoverSocket: jest.fn()
}));

jest.mock('../sdk', () => {
	const sdkIntegration = jest.requireActual<typeof SdkIntegration>('../../testUtils/sdkIntegration');
	return { __esModule: true, default: sdkIntegration.makeSdkMock() };
});

const mockConnections: MockConnection[] = [];

jest.mock('universal-websocket-client', () =>
	jest.fn().mockImplementation(() => {
		const sdkIntegration = jest.requireActual<typeof SdkIntegration>('../../testUtils/sdkIntegration');
		return new sdkIntegration.MockConnection(mockConnections);
	})
);

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const CALL_ID = 'call-uuid';
const USER_ID = 'user-id';
const READINESS_TIMEOUT = 8000;

const mockTerminateNativeCall = terminateNativeCall as jest.Mock;
const mockGetCallState = useCallStore.getState as jest.Mock;
const mockRecoverSocket = recoverSocket as jest.MockedFunction<typeof recoverSocket>;

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

describe('acceptNativeCallWithReadiness against real login readiness', () => {
	let redux: ReturnType<typeof makeReduxStore>;
	let driver: IMockSdkDriver;

	beforeEach(async () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockConnections.length = 0;
		redux = makeReduxStore();
		initStore(redux.store);
		mockGetCallState.mockReturnValue({ call: null, resetNativeCallId: jest.fn() });
		mockRecoverSocket.mockResolvedValue('reopened');
		driver = await buildConnectedDriver(mockConnections, USER_ID);
		addMediaSubs(driver, USER_ID);
		(sdk as unknown as IMockSdk).setClient({ driver });
	});

	afterEach(() => {
		if (driver.socket.pingTimeout) clearTimeout(driver.socket.pingTimeout);
		if (driver.socket.openTimeout) clearTimeout(driver.socket.openTimeout);
		jest.useRealTimers();
	});

	it('recovers the socket, waits for readiness, then answers the call', async () => {
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		// Readiness only lands after the gate is already waiting on it.
		await jest.advanceTimersByTimeAsync(0);
		expect(mediaSession.answerCall).not.toHaveBeenCalled();
		redux.setLoginReady();

		await jest.advanceTimersByTimeAsync(200);
		await gate;

		expect(mockRecoverSocket).toHaveBeenCalledTimes(1);
		expect(mediaSession.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mediaSession.answerCall).toHaveBeenCalledWith(CALL_ID);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
	});

	it('releases its store listener and readiness polling as soon as readiness lands', async () => {
		redux.setLoginReady();
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);
		await jest.advanceTimersByTimeAsync(200);
		await gate;

		expect(redux.listenerCount()).toBe(0);

		// Nothing is left scheduled: no late failure ladder.
		await jest.advanceTimersByTimeAsync(60000);
		expect(mockTerminateNativeCall).not.toHaveBeenCalled();
		expect(mediaSession.endCall).not.toHaveBeenCalled();
	});

	it('runs the failure ladder once and leaves nothing behind when readiness never lands', async () => {
		driver.socket.subscriptions = {};
		const resetNativeCallId = jest.fn();
		mockGetCallState.mockReturnValue({ call: null, resetNativeCallId });
		const mediaSession = makeMediaSession();

		const gate = acceptNativeCallWithReadiness(CALL_ID, mediaSession);

		// Login never authenticates and the media subs never ack.
		await jest.advanceTimersByTimeAsync(READINESS_TIMEOUT);
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
});
