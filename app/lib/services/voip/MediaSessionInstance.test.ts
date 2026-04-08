import type { IClientMediaCall } from '@rocket.chat/media-signaling';
import RNCallKeep from 'react-native-callkeep';

import type { IDDPMessage } from '../../../definitions/IDDPMessage';
import Navigation from '../../navigation/appNavigation';
import { getDMSubscriptionByUsername } from '../../database/services/Subscription';
import { getUidDirectMessage } from '../../methods/helpers/helpers';
import { mediaSessionStore } from './MediaSessionStore';
import { mediaSessionInstance, CallOrchestrator, type CallOrchestratorConfig, type CallResult } from './MediaSessionInstance';

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

type MockMediaSignalingSession = {
	userId: string;
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
			this.userId = config.userId;
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

describe('CallOrchestrator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		createdSessions.length = 0;
		mockGetUidDirectMessage.mockReturnValue('other-user-id');
		mockGetDMSubscriptionByUsername.mockResolvedValue(null);
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

	describe('navigation callbacks', () => {
		it('should use default navigation callback', () => {
			mediaSessionInstance.init('user-1');
			expect(Navigation.navigate).not.toHaveBeenCalled();
		});

		it('should allow custom onCallStarted callback', () => {
			const customOnCallStarted = jest.fn();
			const orchestrator = new CallOrchestrator({ onCallStarted: customOnCallStarted });
			(orchestrator as any).onCallStarted();
			expect(customOnCallStarted).toHaveBeenCalled();
		});

		it('should allow custom onCallEnded callback', () => {
			const customOnCallEnded = jest.fn();
			const orchestrator = new CallOrchestrator({ onCallEnded: customOnCallEnded });
			(orchestrator as any).onCallEnded();
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
			mediaSessionInstance.init('user-1');
			mediaSessionInstance.reset();
			expect(mediaSessionStore.dispose).toHaveBeenCalled();
		});
	});
});
