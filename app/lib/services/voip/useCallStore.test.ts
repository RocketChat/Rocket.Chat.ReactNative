import type { IClientMediaCall } from '@rocket.chat/media-signaling';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import { useCallStore } from './useCallStore';

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn(), back: jest.fn() }
}));

jest.mock('../../../containers/ActionSheet', () => ({
	hideActionSheetRef: jest.fn()
}));

jest.mock('react-native-callkeep', () => ({
	setCurrentCallActive: jest.fn(),
	addEventListener: jest.fn(() => ({ remove: jest.fn() })),
	endCall: jest.fn(),
	start: jest.fn(),
	stop: jest.fn(),
	setForceSpeakerphoneOn: jest.fn(),
	setAvailable: jest.fn(),
	setAudioRoute: jest.fn(() => Promise.resolve())
}));

// Re-evaluate `isIOS` per-test (the helper module computes it once at import time from Platform.OS,
// so we replace it with a getter that reflects the current Platform.OS in the test).
jest.mock('../../methods/helpers', () => {
	const actual = jest.requireActual('../../methods/helpers');
	const { Platform } = jest.requireActual('react-native');
	const proxy: Record<string, unknown> = { ...actual };
	Object.defineProperty(proxy, 'isIOS', {
		get() {
			return Platform.OS === 'ios';
		},
		enumerable: true,
		configurable: true
	});
	return proxy;
});

function createMockCall(callId: string, options?: { initialState?: string }) {
	const initialState = options?.initialState ?? 'active';
	const listeners: Record<string, Set<(...args: unknown[]) => void>> = {};
	const emitter = {
		on: (ev: string, fn: (...args: unknown[]) => void) => {
			if (!listeners[ev]) listeners[ev] = new Set();
			listeners[ev].add(fn);
		},
		off: (ev: string, fn: (...args: unknown[]) => void) => {
			listeners[ev]?.delete(fn);
		}
	};
	const emit = (ev: string, ...args: unknown[]) => {
		listeners[ev]?.forEach(fn => fn(...args));
	};
	const localParticipant = {
		local: true,
		role: 'callee',
		muted: false,
		held: false,
		contact: {},
		setMuted: jest.fn(),
		setHeld: jest.fn()
	};
	const remoteParticipants = [
		{
			local: false,
			role: 'caller',
			muted: false,
			held: false,
			contact: { id: 'u', displayName: 'U', username: 'u', sipExtension: '' }
		}
	];
	const call = {
		callId,
		state: initialState,
		hidden: false,
		localParticipant,
		remoteParticipants,
		emitter,
		sendDTMF: jest.fn(),
		hangup: jest.fn(),
		accept: jest.fn(),
		reject: jest.fn()
	} as unknown as IClientMediaCall;
	return { call, emit };
}

describe('createMockCall emitter', () => {
	it('forwards variadic arguments to listeners', () => {
		const { call, emit } = createMockCall('e1');
		const listener = jest.fn();
		call.emitter.on('stateChange', listener);

		emit('stateChange', { kind: 'test' }, 2);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith({ kind: 'test' }, 2);
	});
});

describe('useCallStore controlsVisible', () => {
	beforeEach(() => {
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	});

	it('defaults to true', () => {
		expect(useCallStore.getState().controlsVisible).toBe(true);
	});

	it('toggleControlsVisible flips the value', () => {
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(false);
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(true);
	});

	it('auto-shows controls on stateChange event', () => {
		const { call, emit } = createMockCall('c1');
		useCallStore.getState().setCall(call);
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(false);

		emit('stateChange');

		expect(useCallStore.getState().controlsVisible).toBe(true);
	});

	it('auto-shows controls on trackStateChange event', () => {
		const { call, emit } = createMockCall('c2');
		useCallStore.getState().setCall(call);
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(false);

		emit('trackStateChange');

		expect(useCallStore.getState().controlsVisible).toBe(true);
	});

	it('toggleFocus always shows controls', () => {
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(false);

		useCallStore.getState().toggleFocus();

		expect(useCallStore.getState().controlsVisible).toBe(true);
	});

	it('reset restores controlsVisible to true', () => {
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(false);
		useCallStore.getState().reset();
		expect(useCallStore.getState().controlsVisible).toBe(true);
	});
});

describe('useCallStore roomId', () => {
	beforeEach(() => {
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	});

	it('setRoomId sets the value', () => {
		useCallStore.getState().setRoomId('room-rid-abc');
		expect(useCallStore.getState().roomId).toBe('room-rid-abc');
	});

	it('reset clears roomId to null', () => {
		useCallStore.getState().setRoomId('room-rid-abc');
		useCallStore.getState().reset();
		expect(useCallStore.getState().roomId).toBeNull();
	});

	it('setRoomId persists across setCall until reset', () => {
		useCallStore.getState().setRoomId('room-persist-1');
		const { call } = createMockCall('persist-call');
		useCallStore.getState().setCall(call);
		expect(useCallStore.getState().roomId).toBe('room-persist-1');
	});
});

describe('useCallStore direction', () => {
	beforeEach(() => {
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	});

	it('defaults to null', () => {
		expect(useCallStore.getState().direction).toBeNull();
	});

	it('setDirection sets the value', () => {
		useCallStore.getState().setDirection('outgoing');
		expect(useCallStore.getState().direction).toBe('outgoing');
		useCallStore.getState().setDirection('incoming');
		expect(useCallStore.getState().direction).toBe('incoming');
	});

	it('reset clears direction to null', () => {
		useCallStore.getState().setDirection('outgoing');
		useCallStore.getState().reset();
		expect(useCallStore.getState().direction).toBeNull();
	});
});

describe('useCallStore callStartTime', () => {
	beforeEach(() => {
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('sets callStartTime when transitioning ringing to active', () => {
		jest.useFakeTimers();
		const fixed = new Date('2020-01-01T00:00:00.000Z');
		jest.setSystemTime(fixed);
		const { call, emit } = createMockCall('ring-to-active', { initialState: 'ringing' });
		useCallStore.getState().setCall(call);
		expect(useCallStore.getState().callStartTime).toBeNull();

		(call as { state: string }).state = 'active';
		emit('stateChange');

		expect(useCallStore.getState().callStartTime).toBe(fixed.getTime());
		expect(useCallStore.getState().callState).toBe('active');
	});
});

describe('useCallStore native accepted + stale timer', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	it('reset preserves nativeAcceptedCallId', () => {
		useCallStore.getState().setNativeAcceptedCallId('cid');
		useCallStore.getState().reset();
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBe('cid');
		expect(s.callId).toBeNull();
		expect(s.call).toBeNull();
	});

	it('resetNativeCallId clears sticky id and callId when unbound', () => {
		useCallStore.getState().setNativeAcceptedCallId('cid');
		useCallStore.getState().resetNativeCallId();
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBeNull();
		expect(s.callId).toBeNull();
	});

	it('setNativeAcceptedCallId sets only nativeAcceptedCallId (not transient callId)', () => {
		useCallStore.getState().setNativeAcceptedCallId('x');
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBe('x');
		expect(s.callId).toBeNull();
	});

	it('setNativeAcceptedCallId overwrites previous sticky id', () => {
		useCallStore.getState().setNativeAcceptedCallId('a');
		useCallStore.getState().setNativeAcceptedCallId('b');
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBe('b');
		expect(s.callId).toBeNull();
	});

	it('after 60s unbound, clears nativeAcceptedCallId when id still matches scheduled token', () => {
		useCallStore.getState().setNativeAcceptedCallId('stale');
		jest.advanceTimersByTime(60_000);
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBeNull();
		expect(s.callId).toBeNull();
	});

	it('setCall clears native id and cancels stale timer so advance does not clear bound call context', () => {
		useCallStore.getState().setNativeAcceptedCallId('x');
		useCallStore.getState().setCall(createMockCall('x').call);
		jest.advanceTimersByTime(60_000);
		expect(useCallStore.getState().call).not.toBeNull();
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
	});

	it('reset() preserves id and restarts 60s window from last reset', () => {
		useCallStore.getState().setNativeAcceptedCallId('keep');
		jest.advanceTimersByTime(59_000);
		useCallStore.getState().reset();
		jest.advanceTimersByTime(59_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBe('keep');
		jest.advanceTimersByTime(1_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
	});

	it('replacing native id restarts timer so old deadline does not clear new id', () => {
		useCallStore.getState().setNativeAcceptedCallId('a');
		jest.advanceTimersByTime(59_000);
		useCallStore.getState().setNativeAcceptedCallId('b');
		jest.advanceTimersByTime(59_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBe('b');
		jest.advanceTimersByTime(1_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
	});
});

describe('useCallStore toggleSpeaker', () => {
	const originalOS = Platform.OS;

	beforeEach(() => {
		(RNCallKeep.setAudioRoute as jest.Mock).mockClear();
		(InCallManager.setForceSpeakerphoneOn as jest.Mock).mockClear();
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
	});

	afterEach(() => {
		(Platform as { OS: string }).OS = originalOS;
	});

	describe('Android', () => {
		beforeEach(() => {
			(Platform as { OS: string }).OS = 'android';
		});

		it('routes audio to Speaker via RNCallKeep.setAudioRoute and flips isSpeakerOn', async () => {
			const { call } = createMockCall('abc');
			useCallStore.getState().setCall(call);
			expect(useCallStore.getState().isSpeakerOn).toBe(false);

			await useCallStore.getState().toggleSpeaker();

			expect(RNCallKeep.setAudioRoute).toHaveBeenCalledTimes(1);
			expect(RNCallKeep.setAudioRoute).toHaveBeenCalledWith('abc', 'Speaker');
			expect(InCallManager.setForceSpeakerphoneOn).not.toHaveBeenCalled();
			expect(useCallStore.getState().isSpeakerOn).toBe(true);

			await useCallStore.getState().toggleSpeaker();

			expect(RNCallKeep.setAudioRoute).toHaveBeenCalledTimes(2);
			expect(RNCallKeep.setAudioRoute).toHaveBeenLastCalledWith('abc', 'Earpiece');
			expect(useCallStore.getState().isSpeakerOn).toBe(false);
		});

		it('does not throw and does not flip isSpeakerOn when call uuid is missing', async () => {
			// Simulate active call object but no callId/native id (defensive — should not normally happen).
			const { call } = createMockCall('abc');
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: null, nativeAcceptedCallId: null });
			const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

			await expect(useCallStore.getState().toggleSpeaker()).resolves.toBeUndefined();

			expect(RNCallKeep.setAudioRoute).not.toHaveBeenCalled();
			expect(useCallStore.getState().isSpeakerOn).toBe(false);
			expect(errorSpy).toHaveBeenCalled();
			errorSpy.mockRestore();
		});
	});

	describe('iOS', () => {
		beforeEach(() => {
			(Platform as { OS: string }).OS = 'ios';
		});

		it('uses InCallManager.setForceSpeakerphoneOn and does not call RNCallKeep.setAudioRoute', async () => {
			const { call } = createMockCall('ios-call');
			useCallStore.getState().setCall(call);

			await useCallStore.getState().toggleSpeaker();

			expect(InCallManager.setForceSpeakerphoneOn).toHaveBeenCalledTimes(1);
			expect(InCallManager.setForceSpeakerphoneOn).toHaveBeenCalledWith(true);
			expect(RNCallKeep.setAudioRoute).not.toHaveBeenCalled();
			expect(useCallStore.getState().isSpeakerOn).toBe(true);
		});
	});
});
