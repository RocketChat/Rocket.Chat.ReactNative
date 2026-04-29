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

import type { VoipPayload } from '../../../definitions/Voip';
import { createVoipEventDispatcher, type MediaCallEventsAdapters } from './MediaCallEvents';
import { useCallStore } from './useCallStore';

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
	const toggleHold = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		toggleHold.mockClear();
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false, toggleHold });
	});

	it('hold: true when isOnHold is false calls toggleHold once', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('hold: true when isOnHold is true does not call toggleHold', () => {
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('hold: false after OS-initiated hold calls toggleHold and markActive', () => {
		const { voipNative: mockVoipNative } = jest.requireMock('./VoipNative');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		dispatch({ type: 'hold', hold: false, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(2);
		expect(mockVoipNative.call.markActive).toHaveBeenCalledWith('uuid-1');
	});

	it('hold: false without prior OS hold does not call toggleHold', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: false, callUuid: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('consecutive hold: true calls toggleHold only once', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('drops event when callUUID does not match active call', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-2' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('does not toggle when no active call object', () => {
		getState.mockReturnValue({ call: null, callId: 'uuid-1', nativeAcceptedCallId: null, isOnHold: false, toggleHold });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('hold: false does not toggle when user already manually resumed', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false, toggleHold });
		dispatch({ type: 'hold', hold: false, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('wasAutoHeld is per-dispatcher instance', () => {
		const { voipNative: mockVoipNative } = jest.requireMock('./VoipNative');
		const dispatchA = createVoipEventDispatcher(makeTestAdapters());
		const dispatchB = createVoipEventDispatcher(makeTestAdapters());
		dispatchA({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		dispatchB({ type: 'hold', hold: false, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1); // only from dispatchA's hold:true
		expect(mockVoipNative.call.markActive).not.toHaveBeenCalled();
	});

	it('clears stale wasAutoHeld when callUUID does not match', () => {
		const { voipNative: mockVoipNative } = jest.requireMock('./VoipNative');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'hold', hold: true, callUuid: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
		getState.mockReturnValue({ call: {}, callId: 'uuid-2', nativeAcceptedCallId: null, isOnHold: true, toggleHold });
		dispatch({ type: 'hold', hold: false, callUuid: 'uuid-1' }); // uuid mismatch -> clears wasAutoHeld
		expect(toggleHold).toHaveBeenCalledTimes(1);
		expect(mockVoipNative.call.markActive).not.toHaveBeenCalled();
	});
});

describe('createVoipEventDispatcher — endCall', () => {
	beforeEach(() => jest.clearAllMocks());

	it('calls mediaSessionInstance.endCall with callUuid', () => {
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'endCall', callUuid: 'end-uuid' });
		expect(mediaSessionInstance.endCall).toHaveBeenCalledWith('end-uuid');
	});
});

describe('createVoipEventDispatcher — mute', () => {
	const toggleMute = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		toggleMute.mockClear();
		getState.mockReturnValue({ ...activeCallBase, isMuted: false, toggleMute });
	});

	it('calls toggleMute when muted differs from OS and UUIDs match', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-1' });
		expect(toggleMute).toHaveBeenCalledTimes(1);
	});

	it('does not call toggleMute when muted state already matches', () => {
		getState.mockReturnValue({ ...activeCallBase, isMuted: true, toggleMute });
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});

	it('drops event when UUID does not match', () => {
		const dispatch = createVoipEventDispatcher(makeTestAdapters());
		dispatch({ type: 'mute', muted: true, callUuid: 'uuid-2' });
		expect(toggleMute).not.toHaveBeenCalled();
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
