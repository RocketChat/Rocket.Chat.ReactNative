import { resetVoipState } from './resetVoipState';
import { useCallStore } from './useCallStore';
import { callLifecycle } from './CallLifecycle';

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

jest.mock('./CallLifecycle', () => ({
	callLifecycle: {
		end: jest.fn().mockResolvedValue(undefined),
		preBindStatus: jest.fn(() => ({ kind: 'idle' }))
	}
}));

describe('resetVoipState', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls reset (pre-bind UUID is now owned by the FSM, not the store)', () => {
		const order: string[] = [];
		const reset = jest.fn(() => {
			order.push('reset');
		});
		(useCallStore.getState as jest.Mock).mockReturnValue({ reset });

		resetVoipState();

		expect(order).toEqual(['reset']);
	});

	it('calls callLifecycle.end("error") to collapse non-idle FSM state', () => {
		const reset = jest.fn();
		(useCallStore.getState as jest.Mock).mockReturnValue({ reset });

		resetVoipState();

		expect(callLifecycle.end).toHaveBeenCalledWith('error');
	});

	it('callLifecycle.end runs before store reset — ensures FSM is collapsed before JS state clears', () => {
		const order: string[] = [];
		(callLifecycle.end as jest.Mock).mockImplementation(() => {
			order.push('lifecycle.end');
			return Promise.resolve();
		});
		const reset = jest.fn(() => {
			order.push('reset');
		});
		(useCallStore.getState as jest.Mock).mockReturnValue({ reset });

		resetVoipState();

		expect(order).toEqual(['lifecycle.end', 'reset']);
	});

	it('C2: clearVoipAcceptDedupeSentinels runs before reset', () => {
		const order: string[] = [];
		const clearSpy = jest.spyOn(
			jest.requireActual('./MediaCallEvents') as { clearVoipAcceptDedupeSentinels: () => void },
			'clearVoipAcceptDedupeSentinels'
		);

		const reset = jest.fn(() => {
			order.push('reset');
		});
		clearSpy.mockImplementation(() => {
			order.push('clearVoipAcceptDedupeSentinels');
		});
		(callLifecycle.end as jest.Mock).mockImplementation(() => {
			order.push('lifecycle.end');
			return Promise.resolve();
		});
		(useCallStore.getState as jest.Mock).mockReturnValue({ reset });

		resetVoipState();

		expect(order).toEqual(['clearVoipAcceptDedupeSentinels', 'lifecycle.end', 'reset']);

		clearSpy.mockRestore();
	});
});
