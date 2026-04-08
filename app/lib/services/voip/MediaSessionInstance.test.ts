import { mediaSessionInstance, CallOrchestrator } from './MediaSessionInstance';

jest.mock('./MediaSessionStore', () => ({
	mediaSessionStore: {
		setWebRTCProcessorFactory: jest.fn(),
		setSendSignalFn: jest.fn(),
		getInstance: jest.fn(() => ({
			on: jest.fn(),
			processSignal: jest.fn(),
			startCall: jest.fn(),
			getMainCall: jest.fn()
		})),
		dispose: jest.fn(),
		onChange: jest.fn(() => jest.fn())
	}
}));

jest.mock('../../database/services/Subscription', () => ({
	getDMSubscriptionByUsername: jest.fn()
}));

jest.mock('../../methods/helpers/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'other-user-id')
}));

const mockGetDMSubscriptionByUsername = jest.fn();
const mockGetUidDirectMessage = jest.fn(() => 'other-user-id');

const mockCallStoreReset = jest.fn();
const mockSetRoomId = jest.fn();
const mockUseCallStoreGetState = jest.fn(() => ({
	reset: mockCallStoreReset,
	setCall: jest.fn(),
	setRoomId: mockSetRoomId,
	resetNativeCallId: jest.fn(),
	call: null as unknown,
	callId: null as string | null,
	nativeAcceptedCallId: null as string | null,
	roomId: null as string | null
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: () => mockUseCallStoreGetState()
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

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		endCall: jest.fn(),
		setCurrentCallActive: jest.fn(),
		setAvailable: jest.fn()
	}
}));

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

const mockRequestPhoneStatePermission = jest.fn();
jest.mock('../../methods/voipPhoneStatePermission', () => ({
	requestPhoneStatePermission: () => mockRequestPhoneStatePermission()
}));

jest.mock('@rocket.chat/media-signaling', () => ({
	MediaCallWebRTCProcessor: jest.fn().mockImplementation(function MediaCallWebRTCProcessor(this: unknown) {
		return this;
	}),
	MediaSignalingSession: jest.fn()
}));

describe('CallOrchestrator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetUidDirectMessage.mockReturnValue('other-user-id');
		(mockGetDMSubscriptionByUsername as jest.Mock).mockResolvedValue(null);
		mockUseCallStoreGetState.mockReturnValue({
			reset: mockCallStoreReset,
			setCall: jest.fn(),
			setRoomId: mockSetRoomId,
			resetNativeCallId: jest.fn(),
			call: null,
			callId: null,
			nativeAcceptedCallId: null,
			roomId: null
		});
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

		it('should re-attach newCall listener when mediaSessionStore session changes', () => {
			const { mediaSessionStore } = jest.requireMock('./MediaSessionStore');
			let changeCallback: (() => void) | null = null;
			(mediaSessionStore.onChange as jest.Mock).mockImplementation((cb: () => void) => {
				changeCallback = cb;
				return jest.fn();
			});
			const session1 = {
				on: jest.fn(),
				processSignal: jest.fn(),
				startCall: jest.fn(),
				getMainCall: jest.fn()
			};
			const session2 = {
				on: jest.fn(),
				processSignal: jest.fn(),
				startCall: jest.fn(),
				getMainCall: jest.fn()
			};
			(mediaSessionStore.getInstance as jest.Mock).mockReturnValueOnce(session1).mockReturnValueOnce(session2);

			mediaSessionInstance.init('user-1');
			expect(session1.on).toHaveBeenCalledWith('newCall', expect.any(Function));

			changeCallback?.();
			expect(session2.on).toHaveBeenCalledWith('newCall', expect.any(Function));
		});

		it('should set sendSignal fn after mediaSessionStore.dispose so getInstance sees it', () => {
			const { mediaSessionStore } = jest.requireMock('./MediaSessionStore');
			mediaSessionInstance.init('user-1');
			const disposeCalls = (mediaSessionStore.dispose as jest.Mock).mock.invocationCallOrder;
			const setSendCalls = (mediaSessionStore.setSendSignalFn as jest.Mock).mock.invocationCallOrder;
			const getInstanceCalls = (mediaSessionStore.getInstance as jest.Mock).mock.invocationCallOrder;
			expect(disposeCalls.length).toBeGreaterThan(0);
			expect(setSendCalls.length).toBeGreaterThan(0);
			expect(getInstanceCalls.length).toBeGreaterThan(0);
			// setSendSignalFn must happen AFTER the last dispose and BEFORE getInstance,
			// otherwise makeInstance throws "send signal function must be set".
			const lastDispose = Math.max(...disposeCalls);
			const firstSetSend = Math.min(...setSendCalls);
			const firstGetInstance = Math.min(...getInstanceCalls);
			expect(firstSetSend).toBeGreaterThan(lastDispose);
			expect(firstSetSend).toBeLessThan(firstGetInstance);
		});

		it('should stop previous stream-notify-user listener on re-init', () => {
			const firstStop = jest.fn();
			const secondStop = jest.fn();
			mockOnStreamData.mockReturnValueOnce({ stop: firstStop }).mockReturnValueOnce({ stop: secondStop });
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.init('user-2');
			expect(firstStop).toHaveBeenCalledTimes(1);
			expect(secondStop).not.toHaveBeenCalled();
		});

		it('should not re-attach newCall listener when onChange fires with the same session', () => {
			const { mediaSessionStore } = jest.requireMock('./MediaSessionStore');
			let changeCallback: (() => void) | null = null;
			(mediaSessionStore.onChange as jest.Mock).mockImplementation((cb: () => void) => {
				changeCallback = cb;
				return jest.fn();
			});
			const sameSession = {
				on: jest.fn(),
				processSignal: jest.fn(),
				startCall: jest.fn(),
				getMainCall: jest.fn()
			};
			(mediaSessionStore.getInstance as jest.Mock).mockReturnValue(sameSession);

			mediaSessionInstance.init('user-1');
			changeCallback?.();
			changeCallback?.();

			const newCallAttaches = sameSession.on.mock.calls.filter(([name]) => name === 'newCall').length;
			expect(newCallAttaches).toBe(1);
		});

		it('should unsubscribe previous mediaSessionStore.onChange on re-init', () => {
			const { mediaSessionStore } = jest.requireMock('./MediaSessionStore');
			const firstUnsub = jest.fn();
			const secondUnsub = jest.fn();
			(mediaSessionStore.onChange as jest.Mock).mockReturnValueOnce(firstUnsub).mockReturnValueOnce(secondUnsub);
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.init('user-2');
			expect(firstUnsub).toHaveBeenCalledTimes(1);
			expect(secondUnsub).not.toHaveBeenCalled();
		});

		it('should route sendSignal through sdk.methodCall with user media-calls channel', () => {
			const { mediaSessionStore } = jest.requireMock('./MediaSessionStore');
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

	describe('navigation callbacks', () => {
		it('should use default navigation callback', () => {
			mediaSessionInstance.init('user-1');
			expect(jest.requireMock('../../navigation/appNavigation').default.navigate).not.toHaveBeenCalled();
		});

		it('should allow custom onCallStarted callback', () => {
			const customOnCallStarted = jest.fn();
			const orchestrator = new CallOrchestrator({ onCallStarted: customOnCallStarted });
			(orchestrator as unknown as { onCallStarted: () => void }).onCallStarted();
			expect(customOnCallStarted).toHaveBeenCalled();
		});

		it('should allow custom onCallEnded callback', () => {
			const customOnCallEnded = jest.fn();
			const orchestrator = new CallOrchestrator({ onCallEnded: customOnCallEnded });
			(orchestrator as unknown as { onCallEnded: () => void }).onCallEnded();
			expect(customOnCallEnded).toHaveBeenCalled();
		});
	});

	describe('startCall returns CallResult', () => {
		it('should return success result when session exists', () => {
			mediaSessionInstance.init('user-1');
			const result = mediaSessionInstance.startCall('peer-1', 'user');
			expect(result).toHaveProperty('success');
			expect(result.success).toBe(true);
		});

		it('should return error result when session not initialized', () => {
			mediaSessionInstance.reset();
			const result = mediaSessionInstance.startCall('peer-1', 'user');
			expect(result.success).toBe(false);
			expect(result.error).toBe('Session not initialized');
		});
	});

	describe('answerCall returns CallResult', () => {
		it('should return success when call already in store', async () => {
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				resetNativeCallId: jest.fn(),
				call: { callId: 'existing-call' } as unknown,
				callId: 'existing-call',
				nativeAcceptedCallId: null,
				roomId: null
			});

			mediaSessionInstance.init('user-1');
			const result = await mediaSessionInstance.answerCall('existing-call');
			expect(result.success).toBe(true);
			expect(result.callId).toBe('existing-call');
		});

		it('should return error when call not found', async () => {
			mediaSessionInstance.init('user-1');
			const result = await mediaSessionInstance.answerCall('unknown-call');
			expect(result.success).toBe(false);
			expect(result.error).toBe('Call not found');
		});
	});

	describe('teardown', () => {
		it('should reset controller on reset()', () => {
			const { mediaSessionStore } = jest.requireMock('./MediaSessionStore');
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.reset();
			expect(mediaSessionStore.dispose).toHaveBeenCalled();
		});
	});
});
