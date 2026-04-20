import { DeviceEventEmitter } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import {
	getInitialMediaCallEvents,
	resetMediaCallEventsStateForTesting,
	setupMediaCallEvents,
	type MediaCallEventsAdapters
} from './MediaCallEvents';
import { useCallStore } from './useCallStore';

const mockOnOpenDeepLink = jest.fn();
const mockSetNativeAcceptedCallId = jest.fn();
const mockAddEventListener = jest.fn();
const mockRNCallKeepClearInitialEvents = jest.fn();
const mockSetCurrentCallActive = jest.fn();

jest.mock('../../methods/helpers', () => ({
	...jest.requireActual('../../methods/helpers'),
	isIOS: false
}));

const mockServerSelector = jest.fn(() => 'https://workspace-a.example.com');

function makeTestAdapters(): MediaCallEventsAdapters {
	return {
		getActiveServerUrl: () => mockServerSelector(),
		onOpenDeepLink: mockOnOpenDeepLink
	};
}

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
		endCall: jest.fn(),
		applyRestStateSignals: jest.fn(() => Promise.resolve())
	}
}));

jest.mock('../restApi', () => ({
	registerPushToken: jest.fn(() => Promise.resolve())
}));

jest.mock('./MediaCallLogger', () => ({
	mediaCallLogger: {
		log: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
		error: jest.fn(),
		warn: jest.fn()
	}
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
			resetMediaCallEventsStateForTesting();
			mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(null);
			getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
			teardown = setupMediaCallEvents(makeTestAdapters());
		});

		afterEach(() => {
			teardown?.();
			teardown = undefined;
		});

		describe('VoipAcceptSucceeded', () => {
			it('sets nativeAcceptedCallId and opens deep link with host and callId for incoming_call', () => {
				const payload = buildIncomingPayload({
					callId: 'workspace-b-call',
					host: 'https://workspace-b.open.rocket.chat'
				});

				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);

				expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalledTimes(1);
				expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('workspace-b-call');
				expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
				expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
					callId: 'workspace-b-call',
					host: 'https://workspace-b.open.rocket.chat'
				});
			});

			it('skips deep link open and replays REST state signals when host matches active workspace', () => {
				const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
				mockServerSelector.mockReturnValueOnce('https://workspace-a.example.com');
				const payload = buildIncomingPayload({
					callId: 'same-ws-call',
					host: 'https://workspace-a.example.com'
				});

				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);

				expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('same-ws-call');
				expect(mediaSessionInstance.applyRestStateSignals).toHaveBeenCalledTimes(1);
				expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
			});

			it('does not open deep link or set native id when type is not incoming_call', () => {
				DeviceEventEmitter.emit(
					'VoipAcceptSucceeded',
					buildIncomingPayload({
						callId: 'outgoing-payload-id',
						type: 'outgoing_call'
					})
				);

				expect(NativeVoipModule.clearInitialEvents).not.toHaveBeenCalled();
				expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
				expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
			});

			it('dedupes duplicate VoipAcceptSucceeded for the same callId (idempotent native delivery)', () => {
				const payload = buildIncomingPayload({ callId: 'dedupe-id' });

				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);
				DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);

				expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(1);
				expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
			});
		});

		describe('VoipAcceptFailed', () => {
			it('opens deep link with voipAcceptFailed after native failure event', () => {
				DeviceEventEmitter.emit(
					'VoipAcceptFailed',
					buildIncomingPayload({
						callId: 'failed-b',
						host: 'https://workspace-b.example.com',
						username: 'remote-user'
					})
				);

				expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
				expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
					host: 'https://workspace-b.example.com',
					callId: 'failed-b',
					username: 'remote-user',
					voipAcceptFailed: true
				});
				expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalled();
			});

			it('dedupes duplicate VoipAcceptFailed delivery for the same callId', () => {
				const raw = buildIncomingPayload({ callId: 'fail-dedupe' });

				DeviceEventEmitter.emit('VoipAcceptFailed', raw);
				DeviceEventEmitter.emit('VoipAcceptFailed', raw);

				expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
			});

			it('allows a second failure delivery for the same callId after resetMediaCallEventsStateForTesting', () => {
				const raw = buildIncomingPayload({ callId: 'fail-reset' });
				DeviceEventEmitter.emit('VoipAcceptFailed', raw);
				expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
				resetMediaCallEventsStateForTesting();
				DeviceEventEmitter.emit('VoipAcceptFailed', raw);
				expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(2);
			});
		});
	});

	describe('getInitialMediaCallEvents', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			resetMediaCallEventsStateForTesting();
			mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
			mockRNCallKeepClearInitialEvents.mockClear();
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReset();
			(NativeVoipModule.clearInitialEvents as jest.Mock).mockClear();
			(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([]);
			getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
		});

		it('returns true and opens failure deep link when stash has voipAcceptFailed + host + callId', async () => {
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

			const result = await getInitialMediaCallEvents(makeTestAdapters());

			expect(result).toBe(true);
			expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
				host: 'https://server-b.cold',
				callId: 'cold-fail-call',
				username: 'caller-cold',
				voipAcceptFailed: true
			});
			expect(mockRNCallKeepClearInitialEvents).toHaveBeenCalled();
			expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalled();
			expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
		});

		it('on Android cold start, opens success deep link when incoming payload is present (answered path)', async () => {
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
				buildIncomingPayload({
					callId: 'android-cold-accept',
					host: 'https://android-b.example.com'
				})
			);

			const result = await getInitialMediaCallEvents(makeTestAdapters());

			expect(result).toBe(true);
			expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('android-cold-accept');
			expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
				callId: 'android-cold-accept',
				host: 'https://android-b.example.com'
			});
		});
	});
});

describe('VoipAcceptSucceeded sentinel-correctness (Android)', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('B1: outgoing_call with same callId does not poison sentinel for subsequent incoming_call', () => {
		setupMediaCallEvents(makeTestAdapters());

		// First emit: outgoing_call — type guard should bail before setting sentinel
		DeviceEventEmitter.emit('VoipAcceptSucceeded', buildIncomingPayload({ callId: 'shared-id', type: 'outgoing_call' }));
		expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();

		// Second emit: incoming_call with same callId — must NOT be suppressed
		DeviceEventEmitter.emit(
			'VoipAcceptSucceeded',
			buildIncomingPayload({ callId: 'shared-id', type: 'incoming_call', host: 'https://server-b.example.com' })
		);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('shared-id');
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
	});

	it('B2: different callIds are both processed (not suppressed)', () => {
		setupMediaCallEvents(makeTestAdapters());

		DeviceEventEmitter.emit(
			'VoipAcceptSucceeded',
			buildIncomingPayload({ callId: 'call-A', host: 'https://server-b.example.com' })
		);
		DeviceEventEmitter.emit(
			'VoipAcceptSucceeded',
			buildIncomingPayload({ callId: 'call-B', host: 'https://server-b.example.com' })
		);

		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(2);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('call-A');
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('call-B');
	});

	it('B3: getActiveServerUrl returning undefined falls through to deep-link path', () => {
		const adapters: MediaCallEventsAdapters = {
			getActiveServerUrl: () => undefined,
			onOpenDeepLink: mockOnOpenDeepLink
		};
		setupMediaCallEvents(adapters);

		DeviceEventEmitter.emit(
			'VoipAcceptSucceeded',
			buildIncomingPayload({ callId: 'any-call', host: 'https://server-b.example.com' })
		);

		// isVoipIncomingHostCurrentWorkspace returns false when active URL is falsy
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
			callId: 'any-call',
			host: 'https://server-b.example.com'
		});
	});
});

describe('setupMediaCallEvents — didToggleHoldCallAction', () => {
	const toggleHold = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		toggleHold.mockClear();
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false, toggleHold });
	});

	it('registers didToggleHoldCallAction via RNCallKeep.addEventListener', () => {
		setupMediaCallEvents(makeTestAdapters());
		expect(mockAddEventListener).toHaveBeenCalledWith('didToggleHoldCallAction', expect.any(Function));
	});

	it('hold: true when isOnHold is false calls toggleHold once and does not setCurrentCallActive', () => {
		setupMediaCallEvents(makeTestAdapters());
		getToggleHoldHandler()({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
	});

	it('hold: true when isOnHold is true does not call toggleHold', () => {
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		setupMediaCallEvents(makeTestAdapters());
		getToggleHoldHandler()({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('hold: false after OS-initiated hold calls toggleHold once (auto-resume) and setCurrentCallActive', () => {
		setupMediaCallEvents(makeTestAdapters());
		const handler = getToggleHoldHandler();
		handler({ hold: true, callUUID: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		handler({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(2);
		expect(mockSetCurrentCallActive).toHaveBeenCalledTimes(1);
		expect(mockSetCurrentCallActive).toHaveBeenCalledWith('uuid-1');
	});

	it('hold: false without prior OS-initiated hold does not call toggleHold or setCurrentCallActive', () => {
		setupMediaCallEvents(makeTestAdapters());
		getToggleHoldHandler()({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
		expect(mockSetCurrentCallActive).not.toHaveBeenCalled();
	});

	it('consecutive hold: true events call toggleHold only once', () => {
		setupMediaCallEvents(makeTestAdapters());
		const handler = getToggleHoldHandler();
		handler({ hold: true, callUUID: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		handler({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('clears stale auto-hold when callUUID does not match current call id (e.g. new workspace / call)', () => {
		setupMediaCallEvents(makeTestAdapters());
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
		setupMediaCallEvents(makeTestAdapters());
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
		setupMediaCallEvents(makeTestAdapters());
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
		const cleanup = setupMediaCallEvents(makeTestAdapters());
		cleanup();
		expect(remove).toHaveBeenCalled();
	});
});
