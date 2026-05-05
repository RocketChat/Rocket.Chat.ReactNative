import type { IClientMediaCall } from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';
import { waitFor } from '@testing-library/react-native';

import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import Navigation from '../../navigation/appNavigation';
import { getDMSubscriptionByUsername } from '../../database/services/Subscription';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { mediaSessionStore } from './MediaSessionStore';
import { mediaSessionInstance } from './MediaSessionInstance';

const mockLog = jest.fn();
jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: (...args: unknown[]) => mockLog(...args)
}));

const mockTerminateNativeCall = jest.fn();
jest.mock('./terminateNativeCall', () => ({
	terminateNativeCall: (...args: unknown[]) => mockTerminateNativeCall(...args)
}));

jest.mock('../../database/services/Subscription', () => ({
	getDMSubscriptionByUsername: jest.fn()
}));

jest.mock('../../methods/helpers/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'other-user-id')
}));

const mockGetDMSubscriptionByUsername = jest.mocked(getDMSubscriptionByUsername);
const mockGetUidDirectMessage = jest.mocked(getUidDirectMessage);

const mockCallStoreReset = jest.fn();
const mockSetRoomId = jest.fn();
const mockSetDirection = jest.fn();
const mockUseCallStoreGetState = jest.fn(() => ({
	reset: mockCallStoreReset,
	setCall: jest.fn(),
	setRoomId: mockSetRoomId,
	setDirection: mockSetDirection,
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

const mockMediaCallsStateSignals = jest.fn().mockResolvedValue({ signals: [], success: true });

jest.mock('../restApi', () => ({
	mediaCallsStateSignals: (...args: unknown[]) => mockMediaCallsStateSignals(...args)
}));

const mockAuxStoreState = {
	settings: {
		VoIP_TeamCollab_Ice_Servers: '',
		VoIP_TeamCollab_Ice_Gathering_Timeout: 5000
	},
	login: { user: { id: 'user-1' } }
};

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => mockAuxStoreState),
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
	default: {
		getUniqueId: jest.fn(() => 'test-device-id'),
		getUniqueIdSync: jest.fn(() => 'test-device-id'),
		hasNotch: jest.fn(() => false),
		getReadableVersion: jest.fn(() => '1.0.0')
	},
	getUniqueId: jest.fn(() => 'test-device-id'),
	getUniqueIdSync: jest.fn(() => 'test-device-id'),
	hasNotch: jest.fn(() => false),
	getReadableVersion: jest.fn(() => '1.0.0')
}));

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: { stopNativeDDPClient: jest.fn() }
}));

jest.mock('../../navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn() },
	waitForNavigationReady: jest.fn().mockResolvedValue(undefined)
}));

const mockRequestVoipCallPermissions = jest.fn().mockResolvedValue(true);
jest.mock('../../methods/voipCallPermissions', () => ({
	requestVoipCallPermissions: () => mockRequestVoipCallPermissions()
}));

jest.mock('react-native', () => ({
	Platform: { OS: 'android' }
}));

const mockIsInActiveVoipCall = jest.fn(() => false);
jest.mock('./isInActiveVoipCall', () => ({
	isInActiveVoipCall: () => mockIsInActiveVoipCall()
}));

jest.mock('../../../i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key }
}));

const mockShowErrorAlert = jest.fn();
jest.mock('../../methods/helpers/info', () => ({
	showErrorAlert: (...args: unknown[]) => mockShowErrorAlert(...args)
}));

type MockMediaSignalingSession = {
	userId: string;
	sessionId: string;
	endSession: jest.Mock;
	on: jest.Mock;
	processSignal: jest.Mock;
	setIceGatheringTimeout: jest.Mock;
	startCall: jest.Mock;
	getCallData: jest.Mock;
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
			this.getCallData = jest.fn();
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
	contact?: { username?: string; sipExtension?: string };
}): IClientMediaCall {
	const reject = options.reject ?? jest.fn();
	const emitter = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
	return {
		callId: options.callId,
		hidden: options.hidden ?? false,
		localParticipant: { local: true, role: options.role, muted: false, held: false, contact: {} },
		remoteParticipants: [
			{
				local: false,
				role: options.role === 'caller' ? 'callee' : 'caller',
				muted: false,
				held: false,
				contact: options.contact ?? {}
			}
		],
		reject,
		emitter: emitter as unknown as IClientMediaCall['emitter']
	} as unknown as IClientMediaCall;
}

describe('MediaSessionInstance', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockMediaCallsStateSignals.mockResolvedValue({ signals: [], success: true });
		mockRequestVoipCallPermissions.mockResolvedValue(true);
		createdSessions.length = 0;
		mockGetUidDirectMessage.mockReturnValue('other-user-id');
		mockGetDMSubscriptionByUsername.mockResolvedValue(null);
		mockIsInActiveVoipCall.mockReturnValue(false);
		mockUseCallStoreGetState.mockReturnValue({
			reset: mockCallStoreReset,
			setCall: jest.fn(),
			setRoomId: mockSetRoomId,
			setDirection: mockSetDirection,
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
		it('should register stream-notify-user listener', async () => {
			await mediaSessionInstance.init('user-1');
			expect(mockOnStreamData).toHaveBeenCalledWith('stream-notify-user', expect.any(Function));
		});

		it('should create session with userId', async () => {
			await mediaSessionInstance.init('user-abc');
			expect(createdSessions).toHaveLength(1);
			expect(createdSessions[0].userId).toBe('user-abc');
		});

		it('should fetch REST state signals on init', async () => {
			await mediaSessionInstance.init('user-1');
			expect(mockMediaCallsStateSignals).toHaveBeenCalledWith('test-device-id');
		});

		it('should route sendSignal through sdk.methodCall with user media-calls channel', async () => {
			const spy = jest.spyOn(mediaSessionStore, 'setSendSignalFn');
			await mediaSessionInstance.init('user-xyz');
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
		it('should call endSession on previous session when init with different userId', async () => {
			await mediaSessionInstance.init('user-1');
			const first = createdSessions[0];
			await mediaSessionInstance.init('user-2');
			expect(first.endSession).toHaveBeenCalled();
			expect(createdSessions[createdSessions.length - 1].userId).toBe('user-2');
		});

		it('should only have one active onChange handler after re-init (getInstance once per change emit)', async () => {
			await mediaSessionInstance.init('user-1');
			await mediaSessionInstance.init('user-2');
			const spy = jest.spyOn(mediaSessionStore, 'getInstance');
			mediaSessionStore.emit('change');
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith('user-2');
			spy.mockRestore();
		});

		it('should throw existing makeInstance error when getInstance after reset without init', async () => {
			await mediaSessionInstance.init('user-1');
			mediaSessionInstance.reset();
			expect(() => mediaSessionStore.getInstance('any')).toThrow(/must be set/);
		});

		it('should allow init after reset', async () => {
			await mediaSessionInstance.init('user-1');
			mediaSessionInstance.reset();
			await mediaSessionInstance.init('user-2');
			expect(createdSessions[createdSessions.length - 1].userId).toBe('user-2');
		});

		it('should not throw when reset is called twice', async () => {
			await mediaSessionInstance.init('user-1');
			expect(() => {
				mediaSessionInstance.reset();
				mediaSessionInstance.reset();
			}).not.toThrow();
		});
	});

	describe('newCall (no JS busy-reject; native decides)', () => {
		it('allows incoming callee newCall when store already has an active call', async () => {
			const mockSetCall = jest.fn();
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: mockSetCall,
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: { callId: 'active-a' } as IClientMediaCall,
				callId: 'active-a',
				nativeAcceptedCallId: null,
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
			const incoming = buildClientMediaCall({ callId: 'incoming-b', role: 'callee' });
			getNewCallHandler()({ call: incoming });
			expect(incoming.reject).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall).not.toHaveBeenCalledWith('incoming-b');
		});

		it('allows incoming callee newCall when nativeAcceptedCallId is set but differs from incoming callId', async () => {
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: { callId: 'active-a' } as IClientMediaCall,
				callId: 'active-a',
				nativeAcceptedCallId: 'native-other',
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
			const incoming = buildClientMediaCall({ callId: 'incoming-b', role: 'callee' });
			getNewCallHandler()({ call: incoming });
			expect(incoming.reject).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall).not.toHaveBeenCalledWith('incoming-b');
		});

		it('allows incoming callee newCall when nativeAcceptedCallId matches incoming callId', async () => {
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'same-id',
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
			const incoming = buildClientMediaCall({ callId: 'same-id', role: 'callee' });
			getNewCallHandler()({ call: incoming });
			expect(incoming.reject).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall).not.toHaveBeenCalledWith('same-id');
		});

		it('does not reject outgoing (caller) newCall; binds call and navigates', async () => {
			const mockSetCall = jest.fn();
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: mockSetCall,
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: null,
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
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
			await mediaSessionInstance.init('user-1');
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
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'from-signal',
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
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
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'sticky-only',
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
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
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: { callId: 'from-signal' } as any,
				callId: 'from-signal',
				nativeAcceptedCallId: 'from-signal',
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
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

	describe('REST state signals replay (native accept race)', () => {
		it('calls answerCall from init when REST returns accepted and nativeAcceptedCallId already matches', async () => {
			const answerSpy = jest.spyOn(mediaSessionInstance, 'answerCall').mockResolvedValue(undefined);
			mockMediaCallsStateSignals.mockResolvedValue({
				success: true,
				signals: [
					{
						type: 'notification',
						notification: 'accepted',
						signedContractId: 'test-device-id',
						callId: 'race-call'
					}
				]
			});
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'race-call',
				roomId: null
			});
			await mediaSessionInstance.init('user-1');
			await Promise.resolve();
			expect(answerSpy).toHaveBeenCalledWith('race-call');
			answerSpy.mockRestore();
		});

		it('applyRestStateSignals skips REST when no instance', async () => {
			mediaSessionInstance.reset();
			mockMediaCallsStateSignals.mockClear();
			await mediaSessionInstance.applyRestStateSignals();
			expect(mockMediaCallsStateSignals).not.toHaveBeenCalled();
		});

		it('applyRestStateSignals refetches REST after init', async () => {
			await mediaSessionInstance.init('user-1');
			mockMediaCallsStateSignals.mockClear();
			await mediaSessionInstance.applyRestStateSignals();
			expect(mockMediaCallsStateSignals).toHaveBeenCalledWith('test-device-id');
		});
	});

	describe('startCall', () => {
		it('requests voip call permissions and proceeds when granted', async () => {
			await mediaSessionInstance.init('user-1');
			mockRequestVoipCallPermissions.mockClear();
			const session = createdSessions[0];
			await mediaSessionInstance.startCall('peer-1', 'user');
			expect(mockRequestVoipCallPermissions).toHaveBeenCalledTimes(1);
			expect(session.startCall).toHaveBeenCalledWith('user', 'peer-1');
			expect(mockShowErrorAlert).not.toHaveBeenCalled();
		});

		it('rejects with VoIP_Already_In_Call when an active VoIP call is present', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			mockRequestVoipCallPermissions.mockClear();
			mockIsInActiveVoipCall.mockReturnValue(true);

			await expect(mediaSessionInstance.startCall('peer-1', 'user')).rejects.toThrow('VoIP_Already_In_Call');
			expect(session.startCall).not.toHaveBeenCalled();
			expect(mockRequestVoipCallPermissions).not.toHaveBeenCalled();
		});

		it('silently drops self-call when userId matches logged-in user id', async () => {
			await mediaSessionInstance.init('user-1');
			mockRequestVoipCallPermissions.mockClear();
			const session = createdSessions[0];
			await mediaSessionInstance.startCall('user-1', 'user');
			expect(session.startCall).not.toHaveBeenCalled();
			expect(mockRequestVoipCallPermissions).not.toHaveBeenCalled();
		});

		it('shows alert and skips permission and skips instance.startCall when instance is null', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			mediaSessionInstance.reset();
			mockRequestVoipCallPermissions.mockClear();
			await mediaSessionInstance.startCall('peer-1', 'user');
			expect(mockShowErrorAlert).toHaveBeenCalledTimes(1);
			expect(mockRequestVoipCallPermissions).not.toHaveBeenCalled();
			expect(session.startCall).not.toHaveBeenCalled();
		});

		it('does not place call and shows error when permissions are denied', async () => {
			await mediaSessionInstance.init('user-1');
			mockRequestVoipCallPermissions.mockResolvedValueOnce(false);
			const session = createdSessions[0];
			await mediaSessionInstance.startCall('peer-2', 'user');
			expect(mockRequestVoipCallPermissions).toHaveBeenCalled();
			expect(session.startCall).not.toHaveBeenCalled();
			expect(mockShowErrorAlert).toHaveBeenCalledTimes(1);
		});

		it('startCallByRoom shows alert when instance is null', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			mediaSessionInstance.reset();
			mockGetUidDirectMessage.mockReturnValue('peer-1');
			mediaSessionInstance.startCallByRoom({ rid: 'rid-dm', t: 'd', uids: ['user-1', 'peer-1'] } as any);
			await Promise.resolve();
			expect(mockShowErrorAlert).toHaveBeenCalledTimes(1);
			expect(session.startCall).not.toHaveBeenCalled();
		});

		it('startCallByRoom does not invoke startCall when getUidDirectMessage returns own id (itsMe room)', async () => {
			mockGetUidDirectMessage.mockReturnValue('user-1');
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			mediaSessionInstance.startCallByRoom({ rid: 'rid-self', t: 'd', uids: ['user-1'], itsMe: true } as any);
			expect(session.startCall).not.toHaveBeenCalled();
		});
	});

	describe('roomId population', () => {
		it('startCallByRoom sets roomId before startCall', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const order: string[] = [];
			mockSetRoomId.mockImplementationOnce(() => {
				order.push('setRoomId');
			});
			session.startCall.mockImplementationOnce(() => {
				order.push('startCall');
			});

			mediaSessionInstance.startCallByRoom({ rid: 'rid-dm', t: 'd', uids: ['a', 'b'] } as any);

			// startCall is async (awaits permission on Android); flush microtask queue
			await Promise.resolve();
			await Promise.resolve();

			expect(mockSetRoomId).toHaveBeenCalledWith('rid-dm');
			expect(session.startCall).toHaveBeenCalledWith('user', 'other-user-id');
			expect(order).toEqual(['setRoomId', 'startCall']);
		});

		it('startCallByRoom no-ops when an active VoIP call is present (no setRoomId, no session.startCall)', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			mockIsInActiveVoipCall.mockReturnValue(true);

			mediaSessionInstance.startCallByRoom({ rid: 'rid-dm', t: 'd', uids: ['a', 'b'] } as any);

			expect(mockSetRoomId).not.toHaveBeenCalled();
			expect(session.startCall).not.toHaveBeenCalled();
		});

		it('newCall caller triggers DM lookup when roomId is still null', async () => {
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'from-db' } as any);
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const newCallHandler = session.on.mock.calls.find((c: string[]) => c[0] === 'newCall')?.[1] as (p: {
				call: IClientMediaCall;
			}) => void;

			newCallHandler({
				call: {
					hidden: false,
					localParticipant: { role: 'caller' },
					remoteParticipants: [{ contact: { username: 'alice', sipExtension: '' } }],
					callId: 'c1',
					emitter: { on: jest.fn(), off: jest.fn() }
				} as unknown as IClientMediaCall
			});

			await waitFor(() => expect(mockGetDMSubscriptionByUsername).toHaveBeenCalledWith('alice'));
			expect(mockSetRoomId).toHaveBeenCalledWith('from-db');
		});

		it('newCall caller skips DM lookup when roomId already set', async () => {
			await mediaSessionInstance.init('user-1');
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: null,
				roomId: 'preset-rid'
			});
			const session = createdSessions[0];
			const newCallHandler = session.on.mock.calls.find((c: string[]) => c[0] === 'newCall')?.[1] as (p: {
				call: IClientMediaCall;
			}) => void;

			newCallHandler({
				call: {
					hidden: false,
					localParticipant: { role: 'caller' },
					remoteParticipants: [{ contact: { username: 'alice', sipExtension: '' } }],
					callId: 'c1',
					emitter: { on: jest.fn(), off: jest.fn() }
				} as unknown as IClientMediaCall
			});

			await Promise.resolve();
			expect(mockGetDMSubscriptionByUsername).not.toHaveBeenCalled();
		});

		it('newCall caller resolves roomId from DM when contact has both username and sipExtension', async () => {
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'dm-ext' } as any);
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const newCallHandler = session.on.mock.calls.find((c: string[]) => c[0] === 'newCall')?.[1] as (p: {
				call: IClientMediaCall;
			}) => void;

			newCallHandler({
				call: {
					hidden: false,
					localParticipant: { role: 'caller' },
					remoteParticipants: [{ contact: { username: 'alice', sipExtension: '100' } }],
					callId: 'c1',
					emitter: { on: jest.fn(), off: jest.fn() }
				} as unknown as IClientMediaCall
			});

			await waitFor(() => expect(mockSetRoomId).toHaveBeenCalledWith('dm-ext'));
			expect(mockGetDMSubscriptionByUsername).toHaveBeenCalledWith('alice');
		});

		it('answerCall resolves roomId from DM for non-SIP callee', async () => {
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'dm-rid' } as any);
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const mainCall = {
				callId: 'call-ans',
				accept: jest.fn().mockResolvedValue(undefined),
				remoteParticipants: [{ contact: { username: 'bob', sipExtension: '' } }]
			};
			session.getCallData.mockReturnValue(mainCall);

			await mediaSessionInstance.answerCall('call-ans');

			await waitFor(() => expect(mockSetRoomId).toHaveBeenCalledWith('dm-rid'));
			expect(mockGetDMSubscriptionByUsername).toHaveBeenCalledWith('bob');
		});

		it('answerCall resolves roomId from DM when contact has both username and sipExtension', async () => {
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'dm-ext' } as any);
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const mainCall = {
				callId: 'call-sip',
				accept: jest.fn().mockResolvedValue(undefined),
				remoteParticipants: [{ contact: { username: 'bob', sipExtension: 'ext' } }]
			};
			session.getCallData.mockReturnValue(mainCall);

			await mediaSessionInstance.answerCall('call-sip');

			await waitFor(() => expect(mockSetRoomId).toHaveBeenCalledWith('dm-ext'));
			expect(mockGetDMSubscriptionByUsername).toHaveBeenCalledWith('bob');
		});
	});

	describe('answerCall error recovery (B5)', () => {
		it('terminates native call and resets nativeAcceptedCallId when accept() rejects', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const mockResetNativeCallId = jest.fn();
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: mockResetNativeCallId,
				call: null,
				callId: null,
				nativeAcceptedCallId: 'call-fail',
				roomId: null
			});
			const mainCall = {
				callId: 'call-fail',
				accept: jest.fn().mockRejectedValue(new Error('ICE failure')),
				remoteParticipants: [{ contact: { username: 'bob' } }]
			};
			session.getCallData.mockReturnValue(mainCall);

			await mediaSessionInstance.answerCall('call-fail');

			expect(mockTerminateNativeCall).toHaveBeenCalledWith('call-fail');
			expect(mockResetNativeCallId).toHaveBeenCalledTimes(1);
			expect(mockShowErrorAlert).toHaveBeenCalledTimes(1);
			// Navigation.navigate should NOT be called on the failure path
			expect(Navigation.navigate).not.toHaveBeenCalled();
		});

		it('does not navigate or set call when accept() rejects', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const mockSetCall = jest.fn();
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: mockSetCall,
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'call-err',
				roomId: null
			});
			const mainCall = {
				callId: 'call-err',
				accept: jest.fn().mockRejectedValue(new Error('timeout')),
				remoteParticipants: [{ contact: { username: 'carol' } }]
			};
			session.getCallData.mockReturnValue(mainCall);

			await mediaSessionInstance.answerCall('call-err');

			expect(mockSetCall).not.toHaveBeenCalled();
			expect(Navigation.navigate).not.toHaveBeenCalled();
		});
	});

	describe('startCall post-permission guard (B6)', () => {
		it('throws VoIP_Already_In_Call when active call arrives during permission prompt', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			// isInActiveVoipCall returns false initially, then true after permission resolves
			mockIsInActiveVoipCall
				.mockReturnValueOnce(false) // pre-permission synchronous check passes
				.mockReturnValueOnce(true); // post-permission re-evaluation detects new call

			await expect(mediaSessionInstance.startCall('peer-1', 'user')).rejects.toThrow('VoIP_Already_In_Call');
			expect(mockRequestVoipCallPermissions).toHaveBeenCalledTimes(1);
			expect(session.startCall).not.toHaveBeenCalled();
		});

		it('proceeds to start call when no active call during or after permission prompt', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			// isInActiveVoipCall stays false throughout
			mockIsInActiveVoipCall.mockReturnValue(false);

			await mediaSessionInstance.startCall('peer-1', 'user');

			expect(session.startCall).toHaveBeenCalledWith('user', 'peer-1');
		});

		it('startCallByRoom clears optimistic roomId when post-permission guard rejects', async () => {
			await mediaSessionInstance.init('user-1');
			// pre-permission guard inside startCallByRoom passes (false),
			// pre-permission check inside startCall passes (false),
			// post-permission re-evaluation flips to true and triggers throw.
			mockIsInActiveVoipCall.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);

			mediaSessionInstance.startCallByRoom({ rid: 'rid-dm', t: 'd', uids: ['a', 'b'] } as any);

			// Flush microtasks: setRoomId(rid-dm) -> startCall -> permission await -> throw -> .catch -> setRoomId(null).
			await Promise.resolve();
			await Promise.resolve();
			await Promise.resolve();

			expect(mockSetRoomId).toHaveBeenNthCalledWith(1, 'rid-dm');
			expect(mockSetRoomId).toHaveBeenLastCalledWith(null);
		});
	});

	describe('log() helper — error reporting', () => {
		beforeEach(() => {
			mockLog.mockClear();
		});

		it('calls log when applyRestStateSignals REST fetch rejects', async () => {
			await mediaSessionInstance.init('user-1');
			mockMediaCallsStateSignals.mockRejectedValueOnce(new Error('E_FETCH_SIGNALS'));
			await mediaSessionInstance.applyRestStateSignals();
			expect(mockLog).toHaveBeenCalledWith(expect.any(Error));
		});

		it('calls log when accept() rejects in answerCall', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const mainCall = {
				callId: 'call-log-err',
				accept: jest.fn().mockRejectedValue(new Error('ICE fail')),
				remoteParticipants: [{ contact: { username: 'bob' } }]
			};
			session.getCallData.mockReturnValue(mainCall);
			mockUseCallStoreGetState.mockReturnValue({
				reset: mockCallStoreReset,
				setCall: jest.fn(),
				setRoomId: mockSetRoomId,
				setDirection: mockSetDirection,
				resetNativeCallId: jest.fn(),
				call: null,
				callId: null,
				nativeAcceptedCallId: 'call-log-err',
				roomId: null
			});

			await mediaSessionInstance.answerCall('call-log-err');

			expect(mockLog).toHaveBeenCalledWith(expect.any(Error));
		});

		it('calls log when answerCall call data not found (warn path)', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			session.getCallData.mockReturnValue(null);

			await mediaSessionInstance.answerCall('missing-call');

			expect(mockLog).toHaveBeenCalledWith(expect.any(Error));
		});

		it('calls log when startCallByRoom startCall rejects', async () => {
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			session.startCall.mockRejectedValueOnce(new Error('E_START'));
			mockGetUidDirectMessage.mockReturnValue('peer-x');

			mediaSessionInstance.startCallByRoom({ rid: 'rid-dm', t: 'd', uids: ['a', 'b'] } as any);

			// Flush microtasks to let the rejection propagate to .catch
			await Promise.resolve();
			await Promise.resolve();
			await Promise.resolve();

			expect(mockLog).toHaveBeenCalledWith(expect.any(Error));
		});

		it('calls log when newCall resolveRoomIdFromContact rejects', async () => {
			mockGetDMSubscriptionByUsername.mockRejectedValueOnce(new Error('E_DB'));
			await mediaSessionInstance.init('user-1');
			const session = createdSessions[0];
			const newCallHandler = session.on.mock.calls.find((c: string[]) => c[0] === 'newCall')?.[1] as (p: {
				call: IClientMediaCall;
			}) => void;

			newCallHandler({
				call: {
					hidden: false,
					localParticipant: { role: 'caller' },
					remoteParticipants: [{ contact: { username: 'alice' } }],
					callId: 'c-log',
					emitter: { on: jest.fn(), off: jest.fn() }
				} as unknown as IClientMediaCall
			});

			await waitFor(() => expect(mockLog).toHaveBeenCalledWith(expect.any(Error)));
		});
	});
});
