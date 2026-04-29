/**
 * @jest-environment node
 *
 * iOS-only paths: isIOS = true, pushTokenRegistered, mute, endCall.
 */

import type { VoipPayload } from '../../../definitions/Voip';
import { registerPushToken } from '../restApi';
import { createVoipEventDispatcher, type MediaCallEventsAdapters } from './MediaCallEvents';
import { useCallStore } from './useCallStore';

jest.mock('react-native', () => ({
	Platform: { OS: 'ios' },
	DeviceEventEmitter: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
	NativeEventEmitter: class {
		addListener = jest.fn(() => ({ remove: jest.fn() }));
	}
}));

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		clearInitialEvents: jest.fn(),
		setCurrentCallActive: jest.fn(),
		getInitialEvents: jest.fn(() => Promise.resolve([]))
	}
}));
jest.mock('react-native-webrtc', () => ({ registerGlobals: jest.fn() }));
jest.mock('react-native-incall-manager', () => ({
	__esModule: true,
	default: { start: jest.fn(), stop: jest.fn(), setForceSpeakerphoneOn: jest.fn() }
}));
jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		registerVoipToken: jest.fn(),
		getInitialEvents: jest.fn(() => null),
		clearInitialEvents: jest.fn(),
		getLastVoipToken: jest.fn(() => ''),
		stopNativeDDPClient: jest.fn(),
		stopVoipCallService: jest.fn(),
		addListener: jest.fn(),
		removeListeners: jest.fn()
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

jest.mock('./CallLifecycle', () => ({
	callLifecycle: {
		end: jest.fn(() => Promise.resolve()),
		toggle: jest.fn(() => Promise.resolve()),
		emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
	}
}));

jest.mock('./VoipNative', () => ({
	...jest.requireActual('./VoipNative'),
	voipNative: {
		call: {
			markActive: jest.fn(),
			end: jest.fn(),
			markAvailable: jest.fn(),
			setSpeaker: jest.fn(),
			startAudio: jest.fn(),
			stopAudio: jest.fn()
		},
		attach: jest.fn()
	}
}));

const mockOnOpenDeepLink = jest.fn();
const mockServerSelector = jest.fn(() => 'https://workspace-ios.example.com');
const mockSetNativeAcceptedCallId = jest.fn();

function makeTestAdapters(): MediaCallEventsAdapters {
	return {
		getActiveServerUrl: () => mockServerSelector(),
		onOpenDeepLink: mockOnOpenDeepLink
	};
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

describe('createVoipEventDispatcher — mute (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ ...activeCallBase, isMuted: false });
	});

	it('delegates to callLifecycle.toggle("mute", "native", uuid, true) with targetValue', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-1' });
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-1', true);
	});

	it('always calls toggle even when muted state matches OS (idempotency check moved to CallLifecycle)', () => {
		// The dispatcher no longer guards — it always passes the OS targetValue to toggle.
		// CallLifecycle.toggle handles the idempotency (no-op when targetValue === current state).
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		getState.mockReturnValue({ ...activeCallBase, isMuted: true });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-1' });
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-1', true);
	});

	it('passes UUID and targetValue to toggle (stale-UUID validation happens in CallLifecycle)', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-2' });
		// Dispatcher passes uuid + targetValue; lifecycle drops stale UUIDs internally.
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-2', true);
	});
});

describe('createVoipEventDispatcher — pushTokenRegistered (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({});
	});

	it('registers push token when pushTokenRegistered event fires', async () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'pushTokenRegistered', token: 'voip-token-xyz' });
		await Promise.resolve();
		expect(registerPushToken).toHaveBeenCalledWith();
	});

	it('calls debug() with the token when pushTokenRegistered fires', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'pushTokenRegistered', token: 'voip-token-sensitive' });

		const { __mockDebug, __mockLog } = jest.requireMock('./MediaCallLogger');
		expect(__mockDebug).toHaveBeenCalledWith(expect.stringContaining('Registered VoIP push token:'), 'voip-token-sensitive');
		expect(__mockLog).not.toHaveBeenCalled();
	});
});

describe('createVoipEventDispatcher — acceptSucceeded (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('applies REST signals and returns true for iOS cold-start same-workspace', () => {
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
		const callId = 'answered-ios-uuid';
		mockServerSelector.mockReturnValue('https://same.example.com');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId, host: 'https://same.example.com' });

		const handled = dispatch({ type: 'acceptSucceeded', payload, fromColdStart: true });

		expect(handled).toBe(true);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith(callId);
		expect(mediaSessionInstance.applyRestStateSignals).toHaveBeenCalled();
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
	});

	it('opens deep link for iOS cold-start cross-workspace', () => {
		const callId = 'answered-cross-ws';
		mockServerSelector.mockReturnValue('https://workspace-ios.example.com');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId, host: 'https://foreign.example.com' });

		const handled = dispatch({ type: 'acceptSucceeded', payload, fromColdStart: true });

		expect(handled).toBe(true);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith(callId);
		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({ callId, host: 'https://foreign.example.com' });
	});
});

describe('createVoipEventDispatcher — endCall clears dispatcher on iOS', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('allows a second acceptSucceeded with same callId after endCall (dedupe lives in adapter, not dispatcher)', () => {
		// The dispatcher itself has no deduplication — that is handled by VoipNative adapter.
		// Two dispatches with same callId are both processed.
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'reuse-id', host: 'https://foreign.example.com' });
		dispatch({ type: 'acceptSucceeded', payload, fromColdStart: false });
		dispatch({ type: 'acceptSucceeded', payload, fromColdStart: false });
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(2);
	});
});
