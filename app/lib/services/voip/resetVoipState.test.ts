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
});
