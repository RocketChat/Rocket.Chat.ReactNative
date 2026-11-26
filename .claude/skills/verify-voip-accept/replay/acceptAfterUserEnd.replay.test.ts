import RNCallKeep from 'react-native-callkeep';

import Navigation from '~/lib/navigation/appNavigation';
import { mediaSessionInstance } from '~/lib/services/voip/MediaSessionInstance';
import { useCallStore } from '~/lib/services/voip/useCallStore';

const CALL_ID = 'call-x';
const DEVICE_ID = 'test-device-id';

jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/services/voip/playCallEndedSound', () => ({ playCallEndedSound: jest.fn() }));
jest.mock('~/containers/ActionSheet/Provider', () => ({ hideActionSheetRef: jest.fn() }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('~/lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn(), back: jest.fn() },
	waitForNavigationReady: jest.fn(() => Promise.resolve())
}));
jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: { endCall: jest.fn(), setCurrentCallActive: jest.fn(), setAvailable: jest.fn() }
}));
jest.mock('@rocket.chat/media-signaling', () => ({ MediaCallWebRTCProcessor: jest.fn() }));
jest.mock('react-native-device-info', () => {
	const shared = jest.requireActual('react-native-device-info/jest/react-native-device-info-mock');
	return { __esModule: true, default: shared, ...shared, getUniqueIdSync: () => 'test-device-id' };
});
jest.mock('react-native-webrtc', () => ({ registerGlobals: jest.fn() }));
jest.mock('~/lib/native/NativeVoip', () => ({
	__esModule: true,
	default: {
		startAudioRouteSync: jest.fn(() => Promise.resolve()),
		stopAudioRouteSync: jest.fn(() => Promise.resolve()),
		stopVoipCallService: jest.fn()
	}
}));
jest.mock('~/lib/store/auxStore', () => ({
	store: {
		getState: () => ({ settings: { VoIP_TeamCollab_Ice_Servers: '', VoIP_TeamCollab_Ice_Gathering_Timeout: 5000 } }),
		subscribe: () => jest.fn()
	}
}));
jest.mock('~/lib/services/waitForLoginReady', () => ({ waitForLoginReady: () => Promise.resolve(true) }));

let mockResolveRecoverSocket: (outcome: string) => void = () => {};
jest.mock('~/lib/services/socketHealth', () => ({
	recoverSocket: () =>
		new Promise(resolve => {
			mockResolveRecoverSocket = resolve;
		})
}));
jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		isInitialized: true,
		driver: { waitForNotifyUserMediaSubs: () => Promise.resolve(true) },
		onStreamData: () => Promise.resolve({ stop: jest.fn() }),
		methodCall: jest.fn(() => Promise.resolve())
	}
}));

let mockServerSignals: unknown[] = [];
jest.mock('~/lib/services/restApi', () => ({
	mediaCallsStateSignals: () => Promise.resolve({ signals: mockServerSignals, success: true })
}));

type FakeCall = {
	callId: string;
	state: string;
	hidden: boolean;
	accept: jest.Mock;
	reject: jest.Mock;
	hangup: jest.Mock;
	emitter: { on: jest.Mock; off: jest.Mock };
	localParticipant: { role: string; muted: boolean; held: boolean };
	remoteParticipants: unknown[];
};

const mockKnownCalls = new Map<string, FakeCall>();

function mockMakeCalleeCall(callId: string): FakeCall {
	const call: FakeCall = {
		callId,
		state: 'ringing',
		hidden: false,
		accept: jest.fn(() => {
			if (call.state !== 'ringing') throw new Error('call-not-pending-acceptance');
			call.state = 'accepted';
		}),
		reject: jest.fn(() => {
			call.state = 'hangup';
		}),
		hangup: jest.fn(() => {
			call.state = 'hangup';
		}),
		emitter: { on: jest.fn(), off: jest.fn() },
		localParticipant: { role: 'callee', muted: false, held: false },
		remoteParticipants: []
	};
	return call;
}

const mockSession = {
	processSignal: jest.fn((signal: { callId: string }) => {
		if (!mockKnownCalls.has(signal.callId)) mockKnownCalls.set(signal.callId, mockMakeCalleeCall(signal.callId));
		return Promise.resolve();
	}),
	getCallData: (callId: string) => mockKnownCalls.get(callId),
	on: jest.fn(),
	setIceGatheringTimeout: jest.fn(),
	setIceServers: jest.fn()
};

jest.mock('~/lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: {
		setWebRTCProcessorFactory: jest.fn(),
		setSendSignalFn: jest.fn(),
		getInstance: () => mockSession,
		onChange: () => jest.fn(),
		dispose: jest.fn()
	}
}));

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('replay: user ends a native-accepted call while the accept gate is waiting', () => {
	it('binds and opens CallView for the call the user already ended', async () => {
		mockServerSignals = [];
		await mediaSessionInstance.init('user-1');

		// VoipAcceptSucceeded (MediaCallEvents.ts handleVoipAcceptSucceededFromNative), same workspace.
		useCallStore.getState().setNativeAcceptedCallId(CALL_ID);
		const gate = mediaSessionInstance.acceptNativeCallWithReadiness(CALL_ID);
		await flush();

		// User presses End in CallKit → RNCallKeep endCall listener → mediaSessionInstance.endCall.
		mediaSessionInstance.endCall(CALL_ID);
		expect(RNCallKeep.endCall).toHaveBeenCalledWith(CALL_ID);
		expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();

		// Socket recovers; the REST replay now lists the call, already accepted by this device natively.
		mockServerSignals = [
			{ type: 'new', callId: CALL_ID },
			{ type: 'notification', notification: 'accepted', callId: CALL_ID, signedContractId: DEVICE_ID }
		];
		mockResolveRecoverSocket('confirmed-alive');
		await gate;
		await flush();

		expect(mockKnownCalls.get(CALL_ID)?.accept).toHaveBeenCalled();
		expect(useCallStore.getState().call?.callId).toBe(CALL_ID);
		expect(RNCallKeep.setCurrentCallActive).toHaveBeenCalledWith(CALL_ID);
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
	});

	it('binds the call when the user pressed End before VoipAcceptSucceeded reached JS', async () => {
		mockKnownCalls.clear();
		jest.clearAllMocks();
		useCallStore.getState().reset();
		mockServerSignals = [];
		await mediaSessionInstance.init('user-1');

		// CallKit connected, native REST answer in flight; user presses End → JS endCall for an unknown call.
		mediaSessionInstance.endCall(CALL_ID);
		expect(RNCallKeep.endCall).toHaveBeenCalledWith(CALL_ID);

		// Native REST answer succeeds → VoipAcceptSucceeded (VoipService.swift finishAccept(true)).
		useCallStore.getState().setNativeAcceptedCallId(CALL_ID);
		const gate = mediaSessionInstance.acceptNativeCallWithReadiness(CALL_ID);
		mockServerSignals = [
			{ type: 'new', callId: CALL_ID },
			{ type: 'notification', notification: 'accepted', callId: CALL_ID, signedContractId: DEVICE_ID }
		];
		mockResolveRecoverSocket('confirmed-alive');
		await gate;
		await flush();

		expect(useCallStore.getState().call?.callId).toBe(CALL_ID);
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
	});
});
