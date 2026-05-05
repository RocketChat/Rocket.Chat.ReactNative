/**
 * @jest-environment node
 *
 * iOS-only paths: isIOS = true, NativeEventEmitter for VoIP events, CallKit listeners.
 */
import RNCallKeep from 'react-native-callkeep';

import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import { registerPushToken } from '../restApi';
import {
	getInitialMediaCallEvents,
	resetMediaCallEventsStateForTesting,
	setupMediaCallEvents,
	type MediaCallEventsAdapters
} from './MediaCallEvents';
import { useCallStore } from './useCallStore';

/** Shared bucket for NativeEventEmitter / DeviceEventEmitter VoIP listeners (Jest allows `mock*` refs inside factories). */
const mockNativeVoipListeners: Record<string, ((payload: unknown) => void)[]> = {};

/** Factory: returns an addListener implementation that stores listeners in `bucket`.
 * Named with `mock` prefix so Jest factory scope rules allow it inside jest.mock() calls. */
function mockMakeAddListener(bucket: Record<string, ((payload: unknown) => void)[]>) {
	return (eventType: string, listener: (payload: unknown) => void) => {
		bucket[eventType] = bucket[eventType] || [];
		bucket[eventType].push(listener);
		return {
			remove() {
				const list = bucket[eventType];
				if (!list) {
					return;
				}
				const idx = list.indexOf(listener);
				if (idx >= 0) {
					list.splice(idx, 1);
				}
			}
		};
	};
}

/** Minimal RN surface for MediaCallEvents — avoid `requireActual('react-native')` in @jest-environment node.
 * addListener is defined as a method (not a field initializer) so that mockNativeVoipListeners is
 * captured lazily at call time rather than eagerly when the mock factory / class field runs. */
jest.mock('react-native', () => ({
	Platform: { OS: 'ios' },
	DeviceEventEmitter: {
		addListener(eventType: string, listener: (payload: unknown) => void) {
			return mockMakeAddListener(mockNativeVoipListeners)(eventType, listener);
		}
	},
	NativeEventEmitter: class {
		addListener(eventType: string, listener: (payload: unknown) => void) {
			return mockMakeAddListener(mockNativeVoipListeners)(eventType, listener);
		}
	}
}));

jest.mock('../../methods/helpers', () => ({
	isIOS: true,
	normalizeDeepLinkingServerHost: jest.requireActual('../../methods/helpers/normalizeDeepLinkingServerHost')
		.normalizeDeepLinkingServerHost
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

jest.mock('./MediaSessionInstance', () => ({
	mediaSessionInstance: {
		endCall: jest.fn(),
		applyRestStateSignals: jest.fn(() => Promise.resolve())
	}
}));

jest.mock('../restApi', () => ({
	registerPushToken: jest.fn(() => Promise.resolve())
}));

jest.mock('../connect', () => ({
	checkAndReopen: jest.fn(() => Promise.resolve()),
	awaitDdpLoggedIn: jest.fn(() => Promise.resolve())
}));

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		current: {
			subscribeNotifyUser: jest.fn(() => Promise.resolve())
		}
	}
}));

jest.mock('./MediaCallLogger', () => {
	const log = jest.fn();
	const debug = jest.fn();
	const error = jest.fn();
	const warn = jest.fn();
	class MockMediaCallLogger {
		log = log;
		debug = debug;
		error = error;
		warn = warn;
	}
	return {
		MediaCallLogger: MockMediaCallLogger,
		__mockLog: log,
		__mockDebug: debug
	};
});

const mockAddEventListener = jest.fn();

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
		clearInitialEvents: jest.fn(),
		setCurrentCallActive: jest.fn(),
		getInitialEvents: jest.fn(() => Promise.resolve([]))
	}
}));

const mockOnOpenDeepLink = jest.fn();
const mockServerSelector = jest.fn(() => 'https://workspace-ios.example.com');

function makeTestAdapters(): MediaCallEventsAdapters {
	return {
		getActiveServerUrl: () => mockServerSelector(),
		onOpenDeepLink: mockOnOpenDeepLink
	};
}

function emitNativeVoipEvent(eventType: string, payload: unknown): void {
	mockNativeVoipListeners[eventType]?.forEach(fn => {
		fn(payload);
	});
}

function getEndCallHandler(): (payload: { callUUID: string }) => void {
	const call = mockAddEventListener.mock.calls.find(([name]) => name === 'endCall');
	if (!call) {
		throw new Error('endCall listener not registered');
	}
	return call[1] as (payload: { callUUID: string }) => void;
}

function getMuteHandler(): (p: { muted: boolean; callUUID: string }) => void {
	const call = mockAddEventListener.mock.calls.find(([name]) => name === 'didPerformSetMutedCallAction');
	if (!call) {
		throw new Error('didPerformSetMutedCallAction listener not registered');
	}
	return call[1] as (p: { muted: boolean; callUUID: string }) => void;
}

function buildIncomingPayload(overrides: Partial<VoipPayload> = {}): VoipPayload {
	return {
		callId: 'ios-call-uuid',
		caller: 'caller-id',
		username: 'caller',
		host: 'https://other-server.example.com',
		hostName: 'Other',
		type: 'incoming_call',
		notificationId: 1,
		...overrides
	};
}

const activeCallBase = {
	call: {} as object,
	callId: 'uuid-1',
	nativeAcceptedCallId: null as string | null
};

describe('setupMediaCallEvents — didPerformSetMutedCallAction (iOS)', () => {
	const toggleMute = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		toggleMute.mockClear();
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ ...activeCallBase, isMuted: false, toggleMute });
	});

	it('registers didPerformSetMutedCallAction via RNCallKeep.addEventListener', () => {
		setupMediaCallEvents(makeTestAdapters());
		expect(mockAddEventListener).toHaveBeenCalledWith('didPerformSetMutedCallAction', expect.any(Function));
	});

	it('calls toggleMute when muted state differs from OS and UUIDs match', () => {
		setupMediaCallEvents(makeTestAdapters());
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).toHaveBeenCalledTimes(1);
	});

	it('does not call toggleMute when muted state already matches OS even if UUIDs match', () => {
		getState.mockReturnValue({ ...activeCallBase, isMuted: true, toggleMute });
		setupMediaCallEvents(makeTestAdapters());
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});

	it('drops event when callUUID does not match active call id', () => {
		setupMediaCallEvents(makeTestAdapters());
		getMuteHandler()({ muted: true, callUUID: 'uuid-2' });
		expect(toggleMute).not.toHaveBeenCalled();
	});

	it('drops event when there is no active call object even if UUIDs match', () => {
		getState.mockReturnValue({
			call: null,
			callId: 'uuid-1',
			nativeAcceptedCallId: null,
			isMuted: false,
			toggleMute
		});
		setupMediaCallEvents(makeTestAdapters());
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});
});

describe('setupMediaCallEvents — VoipPushTokenRegistered (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({});
	});

	it('registers push token with no arguments when native emits VoipPushTokenRegistered', async () => {
		setupMediaCallEvents(makeTestAdapters());
		emitNativeVoipEvent('VoipPushTokenRegistered', { token: 'voip-token-xyz' });
		await Promise.resolve();
		expect(registerPushToken).toHaveBeenCalledWith();
	});

	it('calls debug() with the token but NOT log() when VoipPushTokenRegistered is fired', () => {
		setupMediaCallEvents(makeTestAdapters());
		emitNativeVoipEvent('VoipPushTokenRegistered', { token: 'voip-token-sensitive' });

		// Access the mock functions that were passed to the MediaCallLogger class
		const { __mockDebug, __mockLog } = jest.requireMock('./MediaCallLogger');

		// debug() must be called (sensitive data goes through debug level)
		expect(__mockDebug).toHaveBeenCalledWith(expect.stringContaining('Registered VoIP push token:'), 'voip-token-sensitive');
		// log() must NOT be called (sensitive data must not reach ungated log())
		expect(__mockLog).not.toHaveBeenCalled();
	});
});

describe('getInitialMediaCallEvents — iOS cold start', () => {
	const getState = useCallStore.getState as jest.Mock;
	const mockSetNativeAcceptedCallId = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReset();
		(RNCallKeep.getInitialEvents as jest.Mock).mockReset();
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('returns true and applies REST signals when CallKit shows answered and host matches workspace', async () => {
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
		const callId = 'answered-ios-uuid';
		mockServerSelector.mockReturnValue('https://same.example.com');
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
			buildIncomingPayload({
				callId,
				host: 'https://same.example.com'
			})
		);
		(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([
			{ name: 'RNCallKeepPerformAnswerCallAction', data: { callUUID: callId } }
		]);

		const result = await getInitialMediaCallEvents(makeTestAdapters());

		expect(result).toBe(true);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith(callId);
		expect(mediaSessionInstance.applyRestStateSignals).toHaveBeenCalled();
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
	});

	it('returns true and opens deep link when answered on cold start but host differs from workspace', async () => {
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
		const callId = 'answered-cross-ws';
		mockServerSelector.mockReturnValue('https://workspace-ios.example.com');
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
			buildIncomingPayload({
				callId,
				host: 'https://foreign.example.com'
			})
		);
		(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([
			{ name: 'RNCallKeepPerformAnswerCallAction', data: { callUUID: callId } }
		]);

		const result = await getInitialMediaCallEvents(makeTestAdapters());

		expect(result).toBe(true);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith(callId);
		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
			callId,
			host: 'https://foreign.example.com'
		});
		expect(mediaSessionInstance.applyRestStateSignals).not.toHaveBeenCalled();
	});

	it('returns false when CallKit initial events have no RNCallKeepPerformAnswerCallAction', async () => {
		const callId = 'unanswered-ios-uuid';
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
			buildIncomingPayload({ callId, host: 'https://workspace-ios.example.com' })
		);
		(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([
			{ name: 'RNCallKeepDidDisplayIncomingCall', data: { callUUID: callId } }
		]);

		const result = await getInitialMediaCallEvents(makeTestAdapters());

		expect(result).toBe(false);
		expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
	});
});

describe('setupMediaCallEvents — endCall clears accept dedupe (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;
	const mockSetNativeAcceptedCallId = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('allows a second VoipAcceptSucceeded with the same callId after endCall', () => {
		setupMediaCallEvents(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'reuse-id', host: 'https://foreign.example.com' });
		emitNativeVoipEvent('VoipAcceptSucceeded', payload);
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
		getEndCallHandler()({ callUUID: 'any' });
		emitNativeVoipEvent('VoipAcceptSucceeded', payload);
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(2);
	});
});

describe('setupMediaCallEvents — VoipCommunicationDeviceChanged NOT subscribed on iOS', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ setNativeAcceptedCallId: jest.fn() });
	});

	it('VoipCommunicationDeviceChanged listener is not registered on iOS', () => {
		setupMediaCallEvents(makeTestAdapters());
		expect(mockNativeVoipListeners.VoipCommunicationDeviceChanged).toBeUndefined();
	});
});
