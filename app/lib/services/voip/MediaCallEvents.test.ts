import type { VoipPayload } from '../../../definitions/Voip';
import { createVoipEventDispatcher, type MediaCallEventsAdapters } from './MediaCallEvents';
import { useCallStore } from './useCallStore';

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		clearInitialEvents: jest.fn(),
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
	...jest.requireActual('../../methods/helpers'),
	isIOS: false
}));

const mockOnOpenDeepLink = jest.fn();
const mockSetNativeAcceptedCallId = jest.fn();
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

jest.mock('./MediaSessionInstance', () => ({
	mediaSessionInstance: {
		endCall: jest.fn(),
		applyRestStateSignals: jest.fn(() => Promise.resolve())
	}
}));

jest.mock('./CallLifecycle', () => ({
	callLifecycle: {
		end: jest.fn(() => Promise.resolve()),
		toggle: jest.fn(() => Promise.resolve()),
		emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
	}
}));

jest.mock('../restApi', () => ({
	registerPushToken: jest.fn(() => Promise.resolve())
}));

jest.mock('./MediaCallLogger', () => ({
	MediaCallLogger: class {
		log = jest.fn();
		debug = jest.fn();
		error = jest.fn();
		warn = jest.fn();
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

const activeCallBase = {
	call: {} as object,
	callId: 'uuid-1',
	nativeAcceptedCallId: null as string | null
};

describe('createVoipEventDispatcher — acceptSucceeded (Android)', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('sets nativeAcceptedCallId and opens deep link for cross-workspace incoming_call', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'workspace-b-call', host: 'https://workspace-b.open.rocket.chat' });

		const handled = dispatch({ type: 'acceptSucceeded', payload, fromColdStart: false });

		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('workspace-b-call');
		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({ callId: 'workspace-b-call', host: 'https://workspace-b.open.rocket.chat' });
		expect(handled).toBe(true);
	});

	it('replays REST signals when host matches active workspace (live)', () => {
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
		mockServerSelector.mockReturnValueOnce('https://workspace-a.example.com');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'same-ws-call', host: 'https://workspace-a.example.com' });

		dispatch({ type: 'acceptSucceeded', payload, fromColdStart: false });

		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('same-ws-call');
		expect(mediaSessionInstance.applyRestStateSignals).toHaveBeenCalledTimes(1);
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
	});

	it('returns false and skips handler when type is not incoming_call', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());

		const handled = dispatch({
			type: 'acceptSucceeded',
			payload: buildIncomingPayload({ callId: 'outgoing-id', type: 'outgoing_call' }),
			fromColdStart: false
		});

		expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
		expect(handled).toBe(false);
	});

	it('returns false for Android cold-start same workspace (lets appInit run)', () => {
		mockServerSelector.mockReturnValueOnce('https://workspace-a.example.com');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'android-cold', host: 'https://workspace-a.example.com' });

		const handled = dispatch({ type: 'acceptSucceeded', payload, fromColdStart: true });

		expect(handled).toBe(false);
	});

	it('returns true for cold-start cross-workspace', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'cold-b', host: 'https://workspace-b.example.com' });

		const handled = dispatch({ type: 'acceptSucceeded', payload, fromColdStart: true });

		expect(handled).toBe(true);
	});

	it('getActiveServerUrl returning undefined falls through to deep-link path', () => {
		const adapters: MediaCallEventsAdapters = { getActiveServerUrl: () => undefined, onOpenDeepLink: mockOnOpenDeepLink };
		const dispatch = createVoipEventDispatcher(adapters);
		const payload = buildIncomingPayload({ callId: 'any-call', host: 'https://server-b.example.com' });

		dispatch({ type: 'acceptSucceeded', payload, fromColdStart: false });

		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({ callId: 'any-call', host: 'https://server-b.example.com' });
	});

	it('different callIds are both processed', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());

		dispatch({
			type: 'acceptSucceeded',
			payload: buildIncomingPayload({ callId: 'call-A', host: 'https://server-b.example.com' }),
			fromColdStart: false
		});
		dispatch({
			type: 'acceptSucceeded',
			payload: buildIncomingPayload({ callId: 'call-B', host: 'https://server-b.example.com' }),
			fromColdStart: false
		});

		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(2);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('call-A');
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('call-B');
	});

	it('outgoing_call type does not prevent subsequent incoming_call with same callId', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());

		dispatch({
			type: 'acceptSucceeded',
			payload: buildIncomingPayload({ callId: 'shared-id', type: 'outgoing_call' }),
			fromColdStart: false
		});
		expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();

		dispatch({
			type: 'acceptSucceeded',
			payload: buildIncomingPayload({ callId: 'shared-id', type: 'incoming_call', host: 'https://server-b.example.com' }),
			fromColdStart: false
		});
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('shared-id');
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
	});
});

describe('createVoipEventDispatcher — acceptFailed', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
	});

	it('opens deep link with voipAcceptFailed after native failure event', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({
			callId: 'failed-b',
			host: 'https://workspace-b.example.com',
			username: 'remote-user'
		});

		const handled = dispatch({ type: 'acceptFailed', payload, fromColdStart: false });

		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
			host: 'https://workspace-b.example.com',
			callId: 'failed-b',
			username: 'remote-user',
			voipAcceptFailed: true
		});
		expect(handled).toBe(true);
	});

	it('returns true for cold-start failed event', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		const payload = buildIncomingPayload({ callId: 'cold-fail', host: 'https://workspace-b.example.com' });

		const handled = dispatch({ type: 'acceptFailed', payload, fromColdStart: true });

		expect(handled).toBe(true);
	});
});

describe('createVoipEventDispatcher — hold', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false });
	});

	it('hold: true delegates to callLifecycle.toggle("hold", "native", uuid, true)', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('hold', 'native', 'uuid-1', true);
	});

	it('hold: false delegates to callLifecycle.toggle("hold", "native", uuid, false)', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: false, callUuid: 'uuid-1' });
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('hold', 'native', 'uuid-1', false);
	});

	it('hold: true — idempotency and isOnHold check are in CallLifecycle (targetValue passed)', () => {
		// Dispatcher always calls toggle with the OS payload's targetValue.
		// CallLifecycle.toggle handles idempotency (no-op when targetValue === current state).
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		// toggle is always called with the OS-asserted targetValue; lifecycle handles idempotency.
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('hold', 'native', 'uuid-1', true);
	});

	it('drops event when callUUID does not match active call (stale-UUID drop is in CallLifecycle)', () => {
		// The dispatcher no longer does UUID checking itself — it passes uuid + targetValue to toggle.
		// CallLifecycle.toggle does the stale-UUID drop. The dispatcher always calls toggle.
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-2' });
		// Dispatcher passes uuid + targetValue to lifecycle; lifecycle drops the stale event.
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('hold', 'native', 'uuid-2', true);
	});
});

describe('createVoipEventDispatcher — endCall', () => {
	beforeEach(() => jest.clearAllMocks());

	it('tags OS-originated end-call as remote by calling callLifecycle.end("remote")', () => {
		const { callLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'endCall', callUuid: 'end-uuid' });
		expect(callLifecycle.end).toHaveBeenCalledWith('remote');
	});
});

describe('createVoipEventDispatcher — mute', () => {
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		getState.mockReturnValue({ ...activeCallBase, isMuted: false });
	});

	it('muted: true delegates to callLifecycle.toggle("mute", "native", uuid, true)', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-1' });
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-1', true);
	});

	it('always calls toggle (idempotency check is now in CallLifecycle, not the dispatcher)', () => {
		// The dispatcher no longer guards against redundant calls — it always passes the OS
		// payload's targetValue to toggle. CallLifecycle.toggle handles the idempotency check.
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		getState.mockReturnValue({ ...activeCallBase, isMuted: true });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-1' });
		// toggle is always called; lifecycle no-ops when targetValue matches current state.
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-1', true);
	});

	it('muted: false delegates to callLifecycle.toggle("mute", "native", uuid, false)', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		getState.mockReturnValue({ ...activeCallBase, isMuted: true });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: false, callUuid: 'uuid-1' });
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-1', false);
	});

	it('passes UUID and targetValue to toggle for stale-UUID validation in CallLifecycle', () => {
		const { callLifecycle: mockLifecycle } = jest.requireMock('./CallLifecycle');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-2' });
		// Dispatcher passes uuid + targetValue; CallLifecycle.toggle does the stale-UUID drop.
		expect(mockLifecycle.toggle).toHaveBeenCalledWith('mute', 'native', 'uuid-2', true);
	});
});

describe('createVoipEventDispatcher — pushTokenRegistered', () => {
	beforeEach(() => jest.clearAllMocks());

	it('calls registerPushToken on VoipPushTokenRegistered', async () => {
		const { registerPushToken } = jest.requireMock('../restApi');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'pushTokenRegistered', token: 'voip-token-xyz' });
		await Promise.resolve();
		expect(registerPushToken).toHaveBeenCalledWith();
	});
});
