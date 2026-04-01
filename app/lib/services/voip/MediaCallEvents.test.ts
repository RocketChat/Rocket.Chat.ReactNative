import { DeviceEventEmitter } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import { DEEP_LINKING } from '../../../actions/actionsTypes';
import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import { getInitialMediaCallEvents, setupMediaCallEvents } from './MediaCallEvents';
import { useCallStore } from './useCallStore';

const mockDispatch = jest.fn();
const mockSetNativeAcceptedCallId = jest.fn();
const mockAddEventListener = jest.fn();
const mockRNCallKeepClearInitialEvents = jest.fn();
const mockSetCurrentCallActive = jest.fn();

jest.mock('../../methods/helpers', () => ({
	...jest.requireActual('../../methods/helpers'),
	isIOS: false
}));

jest.mock('../../store', () => ({
	__esModule: true,
	default: {
		dispatch: (...args: unknown[]) => mockDispatch(...args)
	}
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		clearInitialEvents: jest.fn(),
		getInitialEvents: jest.fn(() => null)
	}
}));

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
		clearInitialEvents: (...args: unknown[]) => mockRNCallKeepClearInitialEvents(...args),
		setCurrentCallActive: (...args: unknown[]) => mockSetCurrentCallActive(...args),
		getInitialEvents: jest.fn(() => Promise.resolve([]))
	}
}));

jest.mock('./MediaSessionInstance', () => ({
	mediaSessionInstance: {
		endCall: jest.fn()
	}
}));

jest.mock('../restApi', () => ({
	registerPushToken: jest.fn(() => Promise.resolve())
}));

function buildIncomingPayload(overrides: Partial<VoipPayload> = {}): VoipPayload {
	return {
		callId: 'call-b-uuid',
		caller: 'caller-id',
		username: 'caller',
		host: 'https://server-b.example.com',
		hostName: 'Server B',
		type: 'incoming_call',
		notificationId: 1,
		...overrides
	};
}

function getToggleHoldHandler(): (payload: { hold: boolean; callUUID: string }) => void {
	const call = mockAddEventListener.mock.calls.find(([name]) => name === 'didToggleHoldCallAction');
	if (!call) {
		throw new Error('didToggleHoldCallAction listener not registered');
	}
	return call[1] as (payload: { hold: boolean; callUUID: string }) => void;
}

/** Minimal store slice: handler only runs hold logic when call + matching callId/native id exist. */
const activeCallBase = {
	call: {} as object,
	callId: 'uuid-1',
	nativeAcceptedCallId: null as string | null
};

describe('MediaCallEvents cross-server accept (slice 3)', () => {
	const getState = useCallStore.getState as jest.Mock;

	describe('VoipAccept via setupMediaCallEvents', () => {
		let teardown: (() => void) | undefined;

		beforeEach(() => {
			jest.clearAllMocks();
			mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(null);
			getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
			teardown = setupMediaCallEvents();
		});

		afterEach(() => {
			teardown?.();
			teardown = undefined;
		});

		describe('VoipAcceptSucceeded', () => {
			it('sets nativeAcceptedCallId and dispatches deepLinkingOpen with host and callId for incoming_call', () => {
				const payload = buildIncomingPayload({
					callId: 'workspace-b-call',
					host: 'https://workspace-b.open.rocket.chat'
				});

				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);

				expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalledTimes(1);
				expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('workspace-b-call');
				expect(mockDispatch).toHaveBeenCalledTimes(1);
				expect(mockDispatch).toHaveBeenCalledWith({
					type: DEEP_LINKING.OPEN,
					params: {
						callId: 'workspace-b-call',
						host: 'https://workspace-b.open.rocket.chat'
					}
				});
			});

			it('does not dispatch or set native id when type is not incoming_call', () => {
				DeviceEventEmitter.emit(
					'VoipAcceptSucceeded',
					buildIncomingPayload({
						callId: 'outgoing-payload-id',
						type: 'outgoing_call'
					})
				);

				expect(NativeVoipModule.clearInitialEvents).not.toHaveBeenCalled();
				expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
				expect(mockDispatch).not.toHaveBeenCalled();
			});

			it('dedupes duplicate VoipAcceptSucceeded for the same callId (idempotent native delivery)', () => {
				const payload = buildIncomingPayload({ callId: 'dedupe-id' });

				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);
				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);

				expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(1);
				expect(mockDispatch).toHaveBeenCalledTimes(1);
			});
		});

		describe('VoipAcceptFailed', () => {
			it('dispatches deepLinkingOpen with voipAcceptFailed after native failure event', () => {
				DeviceEventEmitter.emit(
					'VoipAcceptFailed',
					buildIncomingPayload({
						callId: 'failed-b',
						host: 'https://workspace-b.example.com',
						username: 'remote-user'
					})
				);

				expect(mockDispatch).toHaveBeenCalledTimes(1);
				expect(mockDispatch).toHaveBeenCalledWith({
					type: DEEP_LINKING.OPEN,
					params: {
						host: 'https://workspace-b.example.com',
						callId: 'failed-b',
						username: 'remote-user',
						voipAcceptFailed: true
					}
				});
				expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalled();
			});

			it('dedupes duplicate VoipAcceptFailed delivery for the same callId', () => {
				const raw = buildIncomingPayload({ callId: 'fail-dedupe' });

				DeviceEventEmitter.emit('VoipAcceptFailed', raw);
				DeviceEventEmitter.emit('VoipAcceptFailed', raw);

				expect(mockDispatch).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('getInitialMediaCallEvents', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
			mockRNCallKeepClearInitialEvents.mockClear();
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReset();
			(NativeVoipModule.clearInitialEvents as jest.Mock).mockClear();
			(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([]);
			getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
		});

		it('returns true and dispatches failure deep link when stash has voipAcceptFailed + host + callId', async () => {
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue({
				voipAcceptFailed: true,
				callId: 'cold-fail-call',
				host: 'https://server-b.cold',
				username: 'caller-cold',
				caller: 'id',
				hostName: 'B',
				type: 'incoming_call',
				notificationId: 1
			});

			const result = await getInitialMediaCallEvents();

			expect(result).toBe(true);
			expect(mockDispatch).toHaveBeenCalledWith({
				type: DEEP_LINKING.OPEN,
				params: {
					host: 'https://server-b.cold',
					callId: 'cold-fail-call',
					username: 'caller-cold',
					voipAcceptFailed: true
				}
			});
			expect(mockRNCallKeepClearInitialEvents).toHaveBeenCalled();
			expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalled();
			expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
		});

		it('on Android cold start, dispatches success deep link when incoming payload is present (answered path)', async () => {
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
				buildIncomingPayload({
					callId: 'android-cold-accept',
					host: 'https://android-b.example.com'
				})
			);

			const result = await getInitialMediaCallEvents();

			expect(result).toBe(true);
			expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('android-cold-accept');
			expect(mockDispatch).toHaveBeenCalledWith({
				type: DEEP_LINKING.OPEN,
				params: {
					callId: 'android-cold-accept',
					host: 'https://android-b.example.com'
				}
			});
		});
	});
});

describe('setupMediaCallEvents — didToggleHoldCallAction', () => {
	const toggleHold = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		toggleHold.mockClear();
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false, toggleHold });
	});

	it('registers didToggleHoldCallAction via RNCallKeep.addEventListener', () => {
		setupMediaCallEvents();
		expect(mockAddEventListener).toHaveBeenCalledWith('didToggleHoldCallAction', expect.any(Function));
	});

	it('hold: true when isOnHold is false calls toggleHold once and does not setCurrentCallActive', () => {
		setupMediaCallEvents();
		getToggleHoldHandler()({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
	});

	it('hold: true when isOnHold is true does not call toggleHold', () => {
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		setupMediaCallEvents();
		getToggleHoldHandler()({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('hold: false after OS-initiated hold calls toggleHold once (auto-resume) and setCurrentCallActive', () => {
		setupMediaCallEvents();
		const handler = getToggleHoldHandler();
		handler({ hold: true, callUUID: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		handler({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(2);
		expect(mockSetCurrentCallActive).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).toHaveBeenCalledWith('uuid-1');
	});

	it('hold: false without prior OS-initiated hold does not call toggleHold or setCurrentCallActive', () => {
		setupMediaCallEvents();
		getToggleHoldHandler()({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
	});

	it('consecutive hold: true events call toggleHold only once', () => {
		setupMediaCallEvents();
		const handler = getToggleHoldHandler();
		handler({ hold: true, callUUID: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		handler({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('clears stale auto-hold when callUUID does not match current call id (e.g. new workspace / call)', () => {
		setupMediaCallEvents();
		const handler = getToggleHoldHandler();
		handler({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		getState.mockReturnValue({
			call: {},
			callId: 'uuid-2',
			nativeAcceptedCallId: null,
			isOnHold: true,
			toggleHold
		});
		handler({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
		handler({ hold: false, callUUID: 'uuid-2' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
	});

	it('does not toggle when there is no active call object even if ids match', () => {
		setupMediaCallEvents();
		const handler = getToggleHoldHandler();
		getState.mockReturnValue({
			call: null,
			callId: 'uuid-1',
			nativeAcceptedCallId: null,
			isOnHold: false,
			toggleHold
		});
		handler({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('hold: false does not call toggleHold when user already manually resumed before OS unhold arrives', () => {
		setupMediaCallEvents();
		const handler = getToggleHoldHandler();

		// OS holds the call
		handler({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);

		// User manually resumes — isOnHold is now false
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false, toggleHold });

		// OS sends hold: false — should be a no-op since call is already resumed
		handler({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
	});

	it('cleanup removes didToggleHoldCallAction subscription', () => {
		const remove = jest.fn();
		mockAddEventListener.mockImplementation((event: string) => {
			if (event === 'didToggleHoldCallAction') {
				return { remove };
			}
			return { remove: jest.fn() };
		});
		const cleanup = setupMediaCallEvents();
		cleanup();
		expect(remove).toHaveBeenCalled();
	});
});
