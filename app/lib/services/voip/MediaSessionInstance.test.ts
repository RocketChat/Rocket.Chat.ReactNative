import type { IClientMediaCall } from '@rocket.chat/media-signaling';
import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import Navigation from '../../navigation/appNavigation';
import RNCallKeep from 'react-native-callkeep';
import { mediaSessionStore } from './MediaSessionStore';
import { mediaSessionInstance } from './MediaSessionInstance';

const mockCallStoreReset = jest.fn();
const mockUseCallStoreGetState = jest.fn(() => ({
	reset: mockCallStoreReset,
	setCall: jest.fn(),
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
	MediaSignalingSession: jest
		.fn()
		.mockImplementation(function MockMediaSignalingSession(this: MockMediaSignalingSession, config: { userId: string }) {
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

const STREAM_NOTIFY_USER = 'stream-notify-user';

function getStreamNotifyHandler(): (ddpMessage: IDDPMessage) => void {
	const calls = mockOnStreamData.mock.calls as unknown as [string, (m: IDDPMessage) => void][];
	for (let i = calls.length - 1; i >= 0; i--) {
		const [eventName, handler] = calls[i];
		if (eventName === STREAM_NOTIFY_USER && typeof handler === 'function') {
			return handler;
		}
	}
	throw new Error('stream-notify-user handler not registered');
}

function getNewCallHandler(): (payload: { call: IClientMediaCall }) => void {
	const session = createdSessions[0];
	if (!session) {
		throw new Error('no session created');
	}
	const entry = session.on.mock.calls.find(([name]) => name === 'newCall');
	if (!entry) {
		throw new Error('newCall handler not registered');
	}
	return entry[1] as (payload: { call: IClientMediaCall }) => void;
}

function buildClientMediaCall(options: {
	callId: string;
	role: 'caller' | 'callee';
	hidden?: boolean;
	reject?: jest.Mock;
}): IClientMediaCall {
	const reject = options.reject ?? jest.fn();
	const emitter = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
	return {
		callId: options.callId,
		role: options.role,
		hidden: options.hidden ?? false,
		reject,
		emitter: emitter as unknown as IClientMediaCall['emitter']
	} as unknown as IClientMediaCall;
}

describe('MediaSessionInstance', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		createdSessions.length = 0;
		mockUseCallStoreGetState.mockReturnValue({
			reset: mockCallStoreReset,
			setCall: jest.fn(),
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

	describe('newCall (no JS busy-reject; native decides)', () => {
		it('allows incoming callee newCall when store already has an active call', () => {
			const mockSetCall = jest.fn();
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: mockSetCall,
				resetNativeCallId: jest.fn(),
				call: { callId: 'active-a' } as IClientMediaCall,
				callId: 'active-a',
				nativeAcceptedCallId: null
			});
			mediaSessionInstance.init('user-1');
			const incoming = buildClientMediaCall({ callId: 'incoming-b', role: 'callee' });
			getNewCallHandler()({ call: incoming });
			expect(incoming.reject).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall).not.toHaveBeenCalledWith('incoming-b');
		});

		it('allows incoming callee newCall when nativeAcceptedCallId is set but differs from incoming callId', () => {
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				resetNativeCallId: jest.fn(),
				call: { callId: 'active-a' } as IClientMediaCall,
				callId: 'active-a',
				nativeAcceptedCallId: 'native-other'
			});
			mediaSessionInstance.init('user-1');
			const incoming = buildClientMediaCall({ callId: 'incoming-b', role: 'callee' });
			getNewCallHandler()({ call: incoming });
			expect(incoming.reject).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall).not.toHaveBeenCalledWith('incoming-b');
		});

		it('allows incoming callee newCall when nativeAcceptedCallId matches incoming callId', () => {
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'same-id'
			});
			mediaSessionInstance.init('user-1');
			const incoming = buildClientMediaCall({ callId: 'same-id', role: 'callee' });
			getNewCallHandler()({ call: incoming });
			expect(incoming.reject).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall).not.toHaveBeenCalledWith('same-id');
		});

		it('does not reject outgoing (caller) newCall; binds call and navigates', () => {
			const mockSetCall = jest.fn();
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: mockSetCall,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: null
			});
			mediaSessionInstance.init('user-1');
			const outgoing = buildClientMediaCall({ callId: 'out-c', role: 'caller' });
			getNewCallHandler()({ call: outgoing });
			expect(outgoing.reject).not.toHaveBeenCalled();
			expect(mockSetCall).toHaveBeenCalledWith(outgoing);
			expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
		});
	});

	describe('stream-notify-user (notification/accepted gated)', () => {
		it('does not call answerCall when nativeAcceptedCallId is null', async () => {
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

		it('calls answerCall when nativeAcceptedCallId matches signal and contract matches device', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
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

	describe('startCall', () => {
		it('requests phone state permission fire-and-forget when starting a call', () => {
			mediaSessionInstance.init('user-1');
			mockRequestPhoneStatePermission.mockClear();
			const session = createdSessions[0];
			mediaSessionInstance.startCall('peer-1', 'user');
			expect(mockRequestPhoneStatePermission).toHaveBeenCalledTimes(1);
			expect(session.startCall).toHaveBeenCalledWith('user', 'peer-1');
		});
	});
});
