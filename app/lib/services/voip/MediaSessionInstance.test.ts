import { mediaSessionStore } from './MediaSessionStore';
import { mediaSessionInstance } from './MediaSessionInstance';

const mockCallStoreReset = jest.fn();

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn(() => ({
			reset: mockCallStoreReset,
			setCall: jest.fn(),
			callId: null as string | null
		}))
	}
}));

const mockOnStreamDataStop = jest.fn();
const mockOnStreamData = jest.fn(() => ({ stop: mockOnStreamDataStop }));
const mockMethodCall = jest.fn();

jest.mock('../sdk', () => ({
	__esModule: true,
	default: {
		onStreamData: (...args: Parameters<typeof mockOnStreamData>) => mockOnStreamData(...args),
		methodCall: (...args: unknown[]) => mockMethodCall(...args)
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			settings: {
				VoIP_TeamCollab_Ice_Servers: '',
				VoIP_TeamCollab_Ice_Gathering_Timeout: 5000
			}
		})),
		subscribe: jest.fn(() => jest.fn())
	}
}));

jest.mock('react-native-webrtc', () => ({
	registerGlobals: jest.fn(),
	mediaDevices: { getUserMedia: jest.fn() }
}));

jest.mock('react-native-callkeep', () => ({}));

jest.mock('react-native-device-info', () => ({
	getUniqueId: jest.fn(() => 'test-device-id'),
	getUniqueIdSync: jest.fn(() => 'test-device-id')
}));

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: { stopNativeDDPClient: jest.fn() }
}));

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn() }
}));

type SessionRecord = { userId: string; endSession: jest.Mock };
const createdSessions: SessionRecord[] = [];

jest.mock('@rocket.chat/media-signaling', () => ({
	MediaCallWebRTCProcessor: jest.fn().mockImplementation(function MediaCallWebRTCProcessor(this: unknown) {
		return this;
	}),
	MediaSignalingSession: jest.fn().mockImplementation(function MockMediaSignalingSession(this: any, config: { userId: string }) {
		const endSession = jest.fn();
		createdSessions.push({ userId: config.userId, endSession });
		this.userId = config.userId;
		this.endSession = endSession;
		this.on = jest.fn();
		this.processSignal = jest.fn().mockResolvedValue(undefined);
		this.setIceGatheringTimeout = jest.fn();
		this.startCall = jest.fn().mockResolvedValue(undefined);
		this.getMainCall = jest.fn();
	})
}));

describe('MediaSessionInstance', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		createdSessions.length = 0;
		mediaSessionInstance.reset();
	});

	afterEach(() => {
		mediaSessionInstance.reset();
	});

	describe('init', () => {
		it('should register stream-notify-user listener', () => {
			mediaSessionInstance.init('user-1');
			expect(mockOnStreamData).toHaveBeenCalledWith('stream-notify-user', expect.any(Function));
		});

		it('should create session with userId', () => {
			mediaSessionInstance.init('user-abc');
			expect(createdSessions).toHaveLength(1);
			expect(createdSessions[0].userId).toBe('user-abc');
		});

		it('should route sendSignal through sdk.methodCall with user media-calls channel', () => {
			const spy = jest.spyOn(mediaSessionStore, 'setSendSignalFn');
			mediaSessionInstance.init('user-xyz');
			expect(spy).toHaveBeenCalled();
			const sendFn = spy.mock.calls[spy.mock.calls.length - 1][0] as (signal: { type: string }) => void;
			sendFn({ type: 'register' });
			expect(mockMethodCall).toHaveBeenCalledWith(
				'stream-notify-user',
				'user-xyz/media-calls',
				expect.stringContaining('register')
			);
			spy.mockRestore();
		});
	});

	describe('teardown and user switch', () => {
		it('should call endSession on previous session when init with different userId', () => {
			mediaSessionInstance.init('user-1');
			const first = createdSessions[0];
			mediaSessionInstance.init('user-2');
			expect(first.endSession).toHaveBeenCalled();
			expect(createdSessions[createdSessions.length - 1].userId).toBe('user-2');
		});

		it('should only have one active onChange handler after re-init (getInstance once per change emit)', () => {
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.init('user-2');
			const spy = jest.spyOn(mediaSessionStore, 'getInstance');
			mediaSessionStore.emit('change');
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith('user-2');
			spy.mockRestore();
		});

		it('should throw existing makeInstance error when getInstance after reset without init', () => {
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.reset();
			expect(() => mediaSessionStore.getInstance('any')).toThrow('WebRTC processor factory and send signal function must be set');
		});

		it('should allow init after reset', () => {
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.reset();
			mediaSessionInstance.init('user-2');
			expect(createdSessions[createdSessions.length - 1].userId).toBe('user-2');
		});

		it('should not throw when reset is called twice', () => {
			mediaSessionInstance.init('user-1');
			expect(() => {
				mediaSessionInstance.reset();
				mediaSessionInstance.reset();
			}).not.toThrow();
		});
	});
});
