import { DeviceEventEmitter } from 'react-native';

import { resetMediaCallEventsStateForTesting, setupMediaCallEvents, type MediaCallEventsAdapters } from './MediaCallEvents';
import { resetVoipState } from './resetVoipState';
import { useCallStore } from './useCallStore';

jest.mock('../../methods/helpers', () => ({
	...jest.requireActual('../../methods/helpers'),
	isIOS: false
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

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		clearInitialEvents: jest.fn(),
		setCurrentCallActive: jest.fn(),
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

const mockOnOpenDeepLink = jest.fn();
const mockSetNativeAcceptedCallId = jest.fn();

function makeTestAdapters(): MediaCallEventsAdapters {
	return {
		getActiveServerUrl: () => undefined,
		onOpenDeepLink: mockOnOpenDeepLink
	};
}

describe('resetVoipState', () => {
	it('calls resetNativeCallId before reset (native id must clear before store reset)', () => {
		const order: string[] = [];
		const resetNativeCallId = jest.fn(() => {
			order.push('resetNativeCallId');
		});
		const reset = jest.fn(() => {
			order.push('reset');
		});
		(useCallStore.getState as jest.Mock).mockReturnValue({ resetNativeCallId, reset });

		resetVoipState();

		expect(order).toEqual(['resetNativeCallId', 'reset']);
	});

	it('C2: clearVoipAcceptDedupeSentinels runs before resetNativeCallId and reset', () => {
		const order: string[] = [];
		const clearSpy = jest.spyOn(
			jest.requireActual('./MediaCallEvents') as { clearVoipAcceptDedupeSentinels: () => void },
			'clearVoipAcceptDedupeSentinels'
		);

		const resetNativeCallId = jest.fn(() => {
			order.push('resetNativeCallId');
		});
		const reset = jest.fn(() => {
			order.push('reset');
		});
		clearSpy.mockImplementation(() => {
			order.push('clearVoipAcceptDedupeSentinels');
		});
		(useCallStore.getState as jest.Mock).mockReturnValue({ resetNativeCallId, reset });

		resetVoipState();

		expect(order).toEqual(['clearVoipAcceptDedupeSentinels', 'resetNativeCallId', 'reset']);

		clearSpy.mockRestore();
	});

	it('C1: after resetVoipState, a previously-handled callId is processed again (sentinel cleared)', () => {
		(useCallStore.getState as jest.Mock).mockReturnValue({
			setNativeAcceptedCallId: mockSetNativeAcceptedCallId,
			resetNativeCallId: jest.fn(),
			reset: jest.fn()
		});
		jest.clearAllMocks();
		resetMediaCallEventsStateForTesting();

		// Wire up event listeners so DeviceEventEmitter delivers VoipAcceptSucceeded
		setupMediaCallEvents(makeTestAdapters());

		const payload = {
			callId: 'reused-call-id',
			caller: 'caller-id',
			username: 'caller',
			host: 'https://server.example.com',
			hostName: 'Server',
			type: 'incoming_call' as const,
			notificationId: 1
		};

		// First delivery — handled, sentinel set
		DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(1);

		// Second delivery without reset — suppressed by dedupe
		DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(1);

		// Reset clears sentinel
		(useCallStore.getState as jest.Mock).mockReturnValue({
			setNativeAcceptedCallId: mockSetNativeAcceptedCallId,
			resetNativeCallId: jest.fn(),
			reset: jest.fn()
		});
		resetVoipState();

		// Third delivery — must be processed again
		DeviceEventEmitter.emit('VoipAcceptSucceeded', payload);
		expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(2);
	});
});
