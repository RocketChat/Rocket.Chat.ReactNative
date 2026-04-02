import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { useCallStore } from './useCallStore';

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn(), back: jest.fn() }
}));

jest.mock('../../../containers/ActionSheet', () => ({
	hideActionSheetRef: jest.fn()
}));

jest.mock('react-native-callkeep', () => ({}));

function createMockCall(callId: string): IClientMediaCall {
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
	const call = {
		callId,
		state: 'active',
		muted: false,
		held: false,
		remoteMute: false,
		remoteHeld: false,
		hidden: false,
		role: 'callee',
		contact: { id: 'u', displayName: 'U', username: 'u', sipExtension: '' },
		emitter,
		setMuted: jest.fn(),
		setHeld: jest.fn(),
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

	it('showControls sets true when hidden', () => {
		useCallStore.getState().toggleControlsVisible();
		expect(useCallStore.getState().controlsVisible).toBe(false);
		useCallStore.getState().showControls();
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

	it('after 15s unbound, clears nativeAcceptedCallId when id still matches scheduled token', () => {
		useCallStore.getState().setNativeAcceptedCallId('stale');
		jest.advanceTimersByTime(15_000);
		const s = useCallStore.getState();
		expect(s.nativeAcceptedCallId).toBeNull();
		expect(s.callId).toBeNull();
	});

	it('setCall clears native id and cancels stale timer so advance does not clear bound call context', () => {
		useCallStore.getState().setNativeAcceptedCallId('x');
		useCallStore.getState().setCall(createMockCall('x').call);
		jest.advanceTimersByTime(15_000);
		expect(useCallStore.getState().call).not.toBeNull();
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
	});

	it('reset() preserves id and restarts 15s window from last reset', () => {
		useCallStore.getState().setNativeAcceptedCallId('keep');
		jest.advanceTimersByTime(14_000);
		useCallStore.getState().reset();
		jest.advanceTimersByTime(14_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBe('keep');
		jest.advanceTimersByTime(1_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
	});

	it('replacing native id restarts timer so old deadline does not clear new id', () => {
		useCallStore.getState().setNativeAcceptedCallId('a');
		jest.advanceTimersByTime(14_000);
		useCallStore.getState().setNativeAcceptedCallId('b');
		jest.advanceTimersByTime(14_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBe('b');
		jest.advanceTimersByTime(1_000);
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
	});
});
