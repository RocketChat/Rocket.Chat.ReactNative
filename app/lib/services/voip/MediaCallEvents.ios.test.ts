/**
 * @jest-environment node
 *
 * iOS-only paths: isIOS = true, NativeEventEmitter for VoIP events, CallKit listeners.
 */
import { NativeEventEmitter } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import type { VoipPayload } from '../../../definitions/Voip';
import NativeVoipModule from '../../native/NativeVoip';
import { registerPushToken } from '../restApi';
import {
	getInitialMediaCallEvents,
	resetMediaCallEventsStateForTesting,
	setupMediaCallEvents,
	type MediaCallEventsRuntime
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

const mockOnOpenDeepLink = jest.fn();
const mockGetActiveWorkspaceServerUrl = jest.fn(() => 'https://active-ws.example.com');

const testRuntime: MediaCallEventsRuntime = {
	onOpenDeepLink: mockOnOpenDeepLink,
	getActiveWorkspaceServerUrl: mockGetActiveWorkspaceServerUrl
};

const mockAddEventListener = jest.fn();

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
		getInitialEvents: jest.fn(() => null),
		addListener: jest.fn(),
		removeListeners: jest.fn()
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

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
		clearInitialEvents: jest.fn(),
		setCurrentCallActive: jest.fn(),
		getInitialEvents: jest.fn(() => Promise.resolve([]))
	}
}));

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

function getNativeEmitterHandler(event: string, addListenerSpy: jest.SpyInstance): (payload: unknown) => void {
	const call = addListenerSpy.mock.calls.find(([name]) => name === event);
	if (!call) {
		throw new Error(`NativeEventEmitter listener for ${event} not registered`);
	}
	return call[1] as (payload: unknown) => void;
}

function buildIncomingPayload(overrides: Partial<VoipPayload> = {}): VoipPayload {
	return {
		callId: 'ios-cold-call',
		caller: 'caller-id',
		username: 'caller',
		host: 'https://other-ws.example.com',
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
	let cleanup: (() => void) | undefined;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		toggleMute.mockClear();
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ ...activeCallBase, isMuted: false, toggleMute });
		cleanup = undefined;
	});

	afterEach(() => {
		cleanup?.();
		cleanup = undefined;
	});

	it('registers didPerformSetMutedCallAction via RNCallKeep.addEventListener', () => {
		cleanup = setupMediaCallEvents(testRuntime);
		expect(mockAddEventListener).toHaveBeenCalledWith('didPerformSetMutedCallAction', expect.any(Function));
	});

	it('calls toggleMute when muted state differs from OS and UUIDs match', () => {
		cleanup = setupMediaCallEvents(testRuntime);
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).toHaveBeenCalledTimes(1);
	});

	it('does not call toggleMute when muted state already matches OS even if UUIDs match', () => {
		getState.mockReturnValue({ ...activeCallBase, isMuted: true, toggleMute });
		cleanup = setupMediaCallEvents(testRuntime);
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});

	it('drops event when callUUID does not match active call id', () => {
		cleanup = setupMediaCallEvents(testRuntime);
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
		cleanup = setupMediaCallEvents(testRuntime);
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});
});

describe('setupMediaCallEvents — VoipPushTokenRegistered (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;
	let addListenerSpy: jest.SpyInstance;
	let cleanup: (() => void) | undefined;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ ...activeCallBase, isMuted: false, toggleMute: jest.fn() });
		addListenerSpy = jest.spyOn(NativeEventEmitter.prototype, 'addListener');
		cleanup = undefined;
	});

	afterEach(() => {
		cleanup?.();
		cleanup = undefined;
		addListenerSpy.mockRestore();
	});

	it('registers VoIP token listener and calls registerPushToken when native emits token', async () => {
		cleanup = setupMediaCallEvents(testRuntime);
		const handler = getNativeEmitterHandler('VoipPushTokenRegistered', addListenerSpy);
		handler({ token: 'voip-device-token' });
		await Promise.resolve();
		expect(registerPushToken).toHaveBeenCalledTimes(1);
	});
});

describe('getInitialMediaCallEvents — iOS cold start', () => {
	const mockSetNativeAcceptedCallId = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReset();
		(RNCallKeep.getInitialEvents as jest.Mock).mockReset();
		getState.mockReturnValue({ setNativeAcceptedCallId: mockSetNativeAcceptedCallId });
		mockGetActiveWorkspaceServerUrl.mockReturnValue('https://active-ws.example.com');
	});

	it('returns true and invokes onOpenDeepLink when CallKit shows answered action for same call UUID (different workspace)', async () => {
		const callId = 'matching-uuid';
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
			buildIncomingPayload({
				callId,
				host: 'https://other-ws.example.com'
			})
		);
		(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([
			{
				name: 'RNCallKeepPerformAnswerCallAction',
				data: { callUUID: callId }
			}
		]);

		const result = await getInitialMediaCallEvents(testRuntime);

		expect(result).toBe(true);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith(callId);
		expect(mockOnOpenDeepLink).toHaveBeenCalledWith({
			callId,
			host: 'https://other-ws.example.com'
		});
	});

	it('clears native VoIP stash when CallKit shows the call was not answered (avoid sticky replay)', async () => {
		const callId = 'unanswered-uuid';
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
			buildIncomingPayload({
				callId,
				host: 'https://other-ws.example.com'
			})
		);
		(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([]);

		const result = await getInitialMediaCallEvents(testRuntime);

		expect(result).toBe(false);
		expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalled();
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
	});

	it('returns true without onOpenDeepLink when host matches active workspace (same-workspace cold accept)', async () => {
		const callId = 'same-ws-uuid';
		(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
			buildIncomingPayload({
				callId,
				host: 'https://active-ws.example.com'
			})
		);
		(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([
			{
				name: 'RNCallKeepPerformAnswerCallAction',
				data: { callUUID: callId }
			}
		]);
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');

		const result = await getInitialMediaCallEvents(testRuntime);

		expect(result).toBe(true);
		expect(mediaSessionInstance.applyRestStateSignals).toHaveBeenCalled();
		expect(mockOnOpenDeepLink).not.toHaveBeenCalled();
	});
});

describe('setupMediaCallEvents — endCall clears accept dedupe (iOS)', () => {
	const getState = useCallStore.getState as jest.Mock;
	let addListenerSpy: jest.SpyInstance;
	let cleanup: (() => void) | undefined;

	beforeEach(() => {
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();
		Object.keys(mockNativeVoipListeners).forEach(k => delete mockNativeVoipListeners[k]);
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ setNativeAcceptedCallId: jest.fn() });
		addListenerSpy = jest.spyOn(NativeEventEmitter.prototype, 'addListener');
		cleanup = undefined;
	});

	afterEach(() => {
		cleanup?.();
		cleanup = undefined;
		addListenerSpy.mockRestore();
	});

	it('allows a second VoipAcceptSucceeded after endCall for the same callId (dedupe reset)', () => {
		const { mediaSessionInstance } = jest.requireMock('./MediaSessionInstance');
		cleanup = setupMediaCallEvents(testRuntime);
		const payload = buildIncomingPayload({ callId: 'dedupe-after-end' });
		const handler = getNativeEmitterHandler('VoipAcceptSucceeded', addListenerSpy);

		handler(payload);
		handler(payload);
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);

		getEndCallHandler()({ callUUID: 'any' });
		(mediaSessionInstance.endCall as jest.Mock).mockClear();
		mockOnOpenDeepLink.mockClear();

		handler(payload);
		expect(mockOnOpenDeepLink).toHaveBeenCalledTimes(1);
	});
});
