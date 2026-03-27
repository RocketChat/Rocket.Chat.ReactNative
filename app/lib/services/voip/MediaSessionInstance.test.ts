import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import { mediaSessionStore } from './MediaSessionStore';
import { mediaSessionInstance } from './MediaSessionInstance';

const mockCallStoreReset = jest.fn();
const mockUseCallStoreGetState = jest.fn(() => ({
	reset: mockCallStoreReset,
	setCall: jest.fn(),
	setCallId: jest.fn(),
	resetNativeCallId: jest.fn(),
	call: null as unknown,
	callId: null as string | null,
	nativeAcceptedCallId: null as string | null
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

type MockMediaSignalingSession = {
	userId: string;
	sessionId: string;
	endSession: jest.Mock;
	on: jest.Mock;
	processSignal: jest.Mock;
	setIceGatheringTimeout: jest.Mock;
	startCall: jest.Mock;
	getMainCall: jest.Mock;
};

const createdSessions: MockMediaSignalingSession[] = [];

jest.mock('@rocket.chat/media-signaling', () => ({
	MediaCallWebRTCProcessor: jest.fn().mockImplementation(function MediaCallWebRTCProcessor(this: unknown) {
		return this;
	}),
	MediaSignalingSession: jest.fn().mockImplementation(function MockMediaSignalingSession(this: MockMediaSignalingSession, config: { userId: string }) {
		const endSession = jest.fn();
		this.userId = config.userId;
		this.endSession = endSession;
		this.on = jest.fn();
		this.processSignal = jest.fn().mockResolvedValue(undefined);
		this.setIceGatheringTimeout = jest.fn();
		this.startCall = jest.fn().mockResolvedValue(undefined);
		this.getMainCall = jest.fn();
		Object.defineProperty(this, 'sessionId', { value: `session-${config.userId}`, writable: false });
		createdSessions.push(this);
	})
}));

function getStreamNotifyHandler(): (ddpMessage: IDDPMessage) => void {
	const calls = mockOnStreamData.mock.calls as unknown as [string, (m: IDDPMessage) => void][];
	const last = calls[calls.length - 1];
	const handler = last?.[1];
	if (typeof handler !== 'function') {
		throw new Error('stream-notify-user handler not registered');
	}
	return handler;
}

describe('MediaSessionInstance', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		createdSessions.length = 0;
		mockUseCallStoreGetState.mockReturnValue({
			reset: mockCallStoreReset,
			setCall: jest.fn(),
			setCallId: jest.fn(),
			resetNativeCallId: jest.fn(),
			call: null,
			callId: null,
			nativeAcceptedCallId: null
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

	describe('stream-notify-user (notification/accepted gated)', () => {
		it('does not call answerCall when store has no native-accepted callId', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mediaSessionInstance.init('user-1');
			const streamHandler = getStreamNotifyHandler();
			streamHandler({
				msg: 'changed',
				fields: {
					eventName: 'uid/media-signal',
					args: [
						{
							type: 'notification',
							notification: 'accepted',
							signedContractId: 'test-device-id',
							callId: 'from-signal'
						}
					]
				}
			});
			await Promise.resolve();
			expect(answerSpy).not.toHaveBeenCalled();
			answerSpy.mockRestore();
		});

		it('does not call answerCall when transient callId matches signal but nativeAcceptedCallId does not', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setCallId: jest.fn(),
				resetNativeCallId: jest.fn(),
				call: null,
				callId: 'from-signal',
				nativeAcceptedCallId: null
			});
			mediaSessionInstance.init('user-1');
			const streamHandler = getStreamNotifyHandler();
			streamHandler({
				msg: 'changed',
				fields: {
					eventName: 'uid/media-signal',
					args: [
						{
							type: 'notification',
							notification: 'accepted',
							signedContractId: 'test-device-id',
							callId: 'from-signal'
						}
					]
				}
			});
			await Promise.resolve();
			expect(answerSpy).not.toHaveBeenCalled();
			answerSpy.mockRestore();
		});

		it('calls answerCall when nativeAcceptedCallId matches signal and contract matches device', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setCallId: jest.fn(),
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'from-signal'
			});
			mediaSessionInstance.init('user-1');
			const streamHandler = getStreamNotifyHandler();
			streamHandler({
				msg: 'changed',
				fields: {
					eventName: 'uid/media-signal',
					args: [
						{
							type: 'notification',
							notification: 'accepted',
							signedContractId: 'test-device-id',
							callId: 'from-signal'
						}
					]
				}
			});
			await Promise.resolve();
			expect(answerSpy).toHaveBeenCalledWith('from-signal');
			answerSpy.mockRestore();
		});

		it('calls answerCall when only nativeAcceptedCallId matches (transient callId null)', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setCallId: jest.fn(),
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'sticky-only'
			});
			mediaSessionInstance.init('user-1');
			const streamHandler = getStreamNotifyHandler();
			streamHandler({
				msg: 'changed',
				fields: {
					eventName: 'uid/media-signal',
					args: [
						{
							type: 'notification',
							notification: 'accepted',
							signedContractId: 'test-device-id',
							callId: 'sticky-only'
						}
					]
				}
			});
			await Promise.resolve();
			expect(answerSpy).toHaveBeenCalledWith('sticky-only');
			answerSpy.mockRestore();
		});

		it('does not call answerCall when store call object is already set', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setCallId: jest.fn(),
				resetNativeCallId: jest.fn(),
				call: { callId: 'from-signal' } as any,
				callId: 'from-signal',
				nativeAcceptedCallId: 'from-signal'
			});
			mediaSessionInstance.init('user-1');
			const streamHandler = getStreamNotifyHandler();
			streamHandler({
				msg: 'changed',
				fields: {
					eventName: 'uid/media-signal',
					args: [
						{
							type: 'notification',
							notification: 'accepted',
							signedContractId: 'test-device-id',
							callId: 'from-signal'
						}
					]
				}
			});
			await Promise.resolve();
			expect(answerSpy).not.toHaveBeenCalled();
			answerSpy.mockRestore();
		});
	});
});
