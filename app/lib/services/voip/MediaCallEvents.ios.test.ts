/**
 * @jest-environment node
 *
 * iOS-only mute tests: requires isIOS = true so didPerformSetMutedCallAction listener is registered.
 */
import { setupMediaCallEvents } from './MediaCallEvents';
import { useCallStore } from './useCallStore';

const mockAddEventListener = jest.fn();

jest.mock('../../methods/helpers', () => ({
	...jest.requireActual('../../methods/helpers'),
	isIOS: true
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
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

const activeCallBase = {
	call: {} as object,
	callId: 'uuid-1',
	nativeAcceptedCallId: null as string | null
};

function getMuteHandler(): (payload: { muted: boolean; callUUID: string }) => void {
	const call = mockAddEventListener.mock.calls.find(([name]) => name === 'didPerformSetMutedCallAction');
	if (!call) {
		throw new Error('didPerformSetMutedCallAction listener not registered');
	}
	return call[1] as (payload: { muted: boolean; callUUID: string }) => void;
}

describe('setupMediaCallEvents — didPerformSetMutedCallAction (iOS)', () => {
	const toggleMute = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		toggleMute.mockClear();
		mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
		getState.mockReturnValue({ ...activeCallBase, isMuted: false, toggleMute });
	});

	it('registers didPerformSetMutedCallAction via RNCallKeep.addEventListener', () => {
		setupMediaCallEvents();
		expect(mockAddEventListener).toHaveBeenCalledWith('didPerformSetMutedCallAction', expect.any(Function));
	});

	it('calls toggleMute when muted state differs from OS and UUIDs match', () => {
		setupMediaCallEvents();
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).toHaveBeenCalledTimes(1);
	});

	it('does not call toggleMute when muted state already matches OS even if UUIDs match', () => {
		getState.mockReturnValue({ ...activeCallBase, isMuted: true, toggleMute });
		setupMediaCallEvents();
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});

	it('drops event when callUUID does not match active call id', () => {
		setupMediaCallEvents();
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
		setupMediaCallEvents();
		getMuteHandler()({ muted: true, callUUID: 'uuid-1' });
		expect(toggleMute).not.toHaveBeenCalled();
	});
});
