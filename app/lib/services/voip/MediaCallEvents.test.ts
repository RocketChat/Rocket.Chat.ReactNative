import { DEEP_LINKING } from '../../../actions/actionsTypes';
import type { VoipPayload } from '../../../definitions/Voip';

const mockDispatch = jest.fn();
const mockSetNativeAcceptedCallId = jest.fn();

jest.mock('../../methods/helpers', () => ({
	...jest.requireActual('../../methods/helpers'),
	isIOS: false
}));

jest.mock('../../store', () => ({
	__esModule: true,
	default: {
		dispatch: (...args: unknown[]) => mockDispatch(...args)
	}
}));

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: () => ({
			setNativeAcceptedCallId: mockSetNativeAcceptedCallId
		})
	}
}));

jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		clearInitialEvents: jest.fn(),
		getInitialEvents: jest.fn(() => null)
	}
}));

const mockRNCallKeepClearInitialEvents = jest.fn();

jest.mock('react-native-callkeep', () => ({
	addEventListener: jest.fn(),
	clearInitialEvents: (...args: unknown[]) => mockRNCallKeepClearInitialEvents(...args),
	getInitialEvents: jest.fn(() => Promise.resolve([]))
}));

jest.mock('./MediaSessionInstance', () => ({
	mediaSessionInstance: {
		endCall: jest.fn()
	}
}));

import RNCallKeep from 'react-native-callkeep';

import NativeVoipModule from '../../native/NativeVoip';
import {
	dispatchVoipAcceptFailureFromNative,
	getInitialMediaCallEvents,
	handleVoipAcceptSucceededFromNative
} from './MediaCallEvents';

function buildIncomingPayload(overrides: Partial<VoipPayload> = {}): VoipPayload {
	return {
		callId: 'call-b-uuid',
		caller: 'caller-id',
		username: 'caller',
		host: 'https://server-b.example.com',
		hostName: 'Server B',
		type: 'incoming_call',
		notificationId: 1,
		...overrides
	};
}

describe('MediaCallEvents cross-server accept (slice 3)', () => {
	describe('handleVoipAcceptSucceededFromNative', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(null);
		});

		it('sets nativeAcceptedCallId and dispatches deepLinkingOpen with host and callId for incoming_call', () => {
			const payload = buildIncomingPayload({
				callId: 'workspace-b-call',
				host: 'https://workspace-b.open.rocket.chat'
			});

			handleVoipAcceptSucceededFromNative(payload);

			expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalledTimes(1);
			expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('workspace-b-call');
			expect(mockDispatch).toHaveBeenCalledTimes(1);
			expect(mockDispatch).toHaveBeenCalledWith({
				type: DEEP_LINKING.OPEN,
				params: {
					callId: 'workspace-b-call',
					host: 'https://workspace-b.open.rocket.chat'
				}
			});
		});

		it('does not dispatch or set native id when type is not incoming_call', () => {
			handleVoipAcceptSucceededFromNative(
				buildIncomingPayload({
					callId: 'outgoing-payload-id',
					type: 'outgoing_call'
				})
			);

			expect(NativeVoipModule.clearInitialEvents).not.toHaveBeenCalled();
			expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
			expect(mockDispatch).not.toHaveBeenCalled();
		});

		it('dedupes duplicate VoipAcceptSucceeded for the same callId (idempotent native delivery)', () => {
			const payload = buildIncomingPayload({ callId: 'dedupe-id' });

			handleVoipAcceptSucceededFromNative(payload);
			handleVoipAcceptSucceededFromNative(payload);

			expect(mockSetNativeAcceptedCallId).toHaveBeenCalledTimes(1);
			expect(mockDispatch).toHaveBeenCalledTimes(1);
		});
	});

	describe('dispatchVoipAcceptFailureFromNative (caller cancel / failed accept)', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('dispatches deepLinkingOpen with voipAcceptFailed when flag is set', () => {
			dispatchVoipAcceptFailureFromNative({
				...buildIncomingPayload({
					callId: 'failed-b',
					host: 'https://workspace-b.example.com',
					username: 'remote-user'
				}),
				voipAcceptFailed: true
			});

			expect(mockDispatch).toHaveBeenCalledTimes(1);
			expect(mockDispatch).toHaveBeenCalledWith({
				type: DEEP_LINKING.OPEN,
				params: {
					host: 'https://workspace-b.example.com',
					callId: 'failed-b',
					username: 'remote-user',
					voipAcceptFailed: true
				}
			});
		});

		it('does not dispatch when voipAcceptFailed is not set', () => {
			dispatchVoipAcceptFailureFromNative(
				buildIncomingPayload({
					callId: 'no-flag-id'
				})
			);

			expect(mockDispatch).not.toHaveBeenCalled();
		});

		it('dedupes duplicate failure delivery for the same callId', () => {
			const raw = {
				...buildIncomingPayload({ callId: 'fail-dedupe' }),
				voipAcceptFailed: true as const
			};

			dispatchVoipAcceptFailureFromNative(raw);
			dispatchVoipAcceptFailureFromNative(raw);

			expect(mockDispatch).toHaveBeenCalledTimes(1);
		});
	});

	describe('getInitialMediaCallEvents', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			mockRNCallKeepClearInitialEvents.mockClear();
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReset();
			(NativeVoipModule.clearInitialEvents as jest.Mock).mockClear();
			(RNCallKeep.getInitialEvents as jest.Mock).mockResolvedValue([]);
		});

		it('returns true and dispatches failure deep link when stash has voipAcceptFailed + host + callId', async () => {
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue({
				voipAcceptFailed: true,
				callId: 'cold-fail-call',
				host: 'https://server-b.cold',
				username: 'caller-cold',
				caller: 'id',
				hostName: 'B',
				type: 'incoming_call',
				notificationId: 1
			});

			const result = await getInitialMediaCallEvents();

			expect(result).toBe(true);
			expect(mockDispatch).toHaveBeenCalledWith({
				type: DEEP_LINKING.OPEN,
				params: {
					host: 'https://server-b.cold',
					callId: 'cold-fail-call',
					username: 'caller-cold',
					voipAcceptFailed: true
				}
			});
			expect(mockRNCallKeepClearInitialEvents).toHaveBeenCalled();
			expect(NativeVoipModule.clearInitialEvents).toHaveBeenCalled();
			expect(mockSetNativeAcceptedCallId).not.toHaveBeenCalled();
		});

		it('on Android cold start, dispatches success deep link when incoming payload is present (answered path)', async () => {
			(NativeVoipModule.getInitialEvents as jest.Mock).mockReturnValue(
				buildIncomingPayload({
					callId: 'android-cold-accept',
					host: 'https://android-b.example.com'
				})
			);

			const result = await getInitialMediaCallEvents();

			expect(result).toBe(true);
			expect(mockSetNativeAcceptedCallId).toHaveBeenCalledWith('android-cold-accept');
			expect(mockDispatch).toHaveBeenCalledWith({
				type: DEEP_LINKING.OPEN,
				params: {
					callId: 'android-cold-accept',
					host: 'https://android-b.example.com'
				}
			});
		});
	});
});
