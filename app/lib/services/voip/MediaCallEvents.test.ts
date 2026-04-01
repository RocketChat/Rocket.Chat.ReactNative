import { setupMediaCallEvents } from './MediaCallEvents';
import { useCallStore } from './useCallStore';

const mockAddEventListener = jest.fn();

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: (...args: unknown[]) => mockAddEventListener(...args)
	}
}));

jest.mock('../../methods/helpers', () => ({
	isIOS: false
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('../../store', () => ({
	__esModule: true,
	default: { dispatch: jest.fn() }
}));

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {}
}));

jest.mock('../restApi', () => ({
	registerPushToken: jest.fn(() => Promise.resolve())
}));

jest.mock('./MediaSessionInstance', () => ({
	mediaSessionInstance: { endCall: jest.fn() }
}));

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

describe('setupMediaCallEvents — didToggleHoldCallAction', () => {
	const toggleHold = jest.fn();
	const getState = useCallStore.getState as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		toggleHold.mockClear();
		mockAddEventListener.mockImplementation(() => ({
			remove: jest.fn()
		}));
		getState.mockReturnValue({ ...activeCallBase, isOnHold: false, toggleHold });
	});

	it('registers didToggleHoldCallAction via RNCallKeep.addEventListener', () => {
		setupMediaCallEvents();
		expect(mockAddEventListener).toHaveBeenCalledWith('didToggleHoldCallAction', expect.any(Function));
	});

	it('hold: true when isOnHold is false calls toggleHold once', () => {
		setupMediaCallEvents();
		getToggleHoldHandler()({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
	});

	it('hold: true when isOnHold is true does not call toggleHold', () => {
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		setupMediaCallEvents();
		getToggleHoldHandler()({ hold: true, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
	});

	it('hold: false after OS-initiated hold calls toggleHold once (auto-resume)', () => {
		setupMediaCallEvents();
		const handler = getToggleHoldHandler();
		handler({ hold: true, callUUID: 'uuid-1' });
		getState.mockReturnValue({ ...activeCallBase, isOnHold: true, toggleHold });
		handler({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).toHaveBeenCalledTimes(2);
	});

	it('hold: false without prior OS-initiated hold does not call toggleHold', () => {
		setupMediaCallEvents();
		getToggleHoldHandler()({ hold: false, callUUID: 'uuid-1' });
		expect(toggleHold).not.toHaveBeenCalled();
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
		handler({ hold: false, callUUID: 'uuid-2' });
		expect(toggleHold).toHaveBeenCalledTimes(1);
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
