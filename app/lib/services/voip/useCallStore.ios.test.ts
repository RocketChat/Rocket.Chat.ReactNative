/**
 * iOS-only guard tests: isIOS = true, audio route sync calls must not fire.
 */
import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { useCallStore } from './useCallStore';

const mockLog = jest.fn();
jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: (...args: unknown[]) => mockLog(...args)
}));

jest.mock('../../methods/helpers', () => ({
	isIOS: true
}));

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
	setAvailable: jest.fn()
}));

const mockStartAudioRouteSync = jest.fn(() => Promise.resolve());
const mockStopAudioRouteSync = jest.fn(() => Promise.resolve());

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		startAudioRouteSync: () => mockStartAudioRouteSync(),
		stopAudioRouteSync: () => mockStopAudioRouteSync(),
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

function createMockCall(callId: string) {
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
	const call = {
		callId,
		state: 'active',
		hidden: false,
		localParticipant: {
			local: true,
			role: 'callee',
			muted: false,
			held: false,
			contact: {},
			setMuted: jest.fn(),
			setHeld: jest.fn()
		},
		remoteParticipants: [{ local: false, role: 'caller', muted: false, held: false, contact: {} }],
		emitter,
		sendDTMF: jest.fn(),
		hangup: jest.fn(),
		accept: jest.fn(),
		reject: jest.fn()
	} as unknown as IClientMediaCall;
	return { call };
}

describe('useCallStore audio route sync (iOS, isIOS=true)', () => {
	beforeEach(() => {
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
		mockStartAudioRouteSync.mockClear();
		mockStopAudioRouteSync.mockClear();
	});

	it('setCall does NOT call startAudioRouteSync', () => {
		const { call } = createMockCall('ios-ar-1');
		useCallStore.getState().setCall(call);
		expect(mockStartAudioRouteSync).not.toHaveBeenCalled();
	});

	it('reset does NOT call stopAudioRouteSync', () => {
		useCallStore.getState().reset();
		expect(mockStopAudioRouteSync).not.toHaveBeenCalled();
	});
});
