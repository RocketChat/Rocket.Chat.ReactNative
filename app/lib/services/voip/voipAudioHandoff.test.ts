import { AppState } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';

import { useCallStore } from './useCallStore';
import {
	isVoipAudioYielded,
	reclaimVoipAudio,
	reclaimVoipAudioOnAppReturn,
	resetVoipAudioHandoff,
	yieldVoipAudio
} from './voipAudioHandoff';

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	events: {},
	logEvent: jest.fn()
}));

jest.mock('~/lib/methods/helpers', () => ({
	isIOS: true,
	isAndroid: false
}));

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		setOnHold: jest.fn(),
		setCurrentCallActive: jest.fn(),
		addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		endCall: jest.fn()
	}
}));

jest.mock('react-native-incall-manager', () => ({
	__esModule: true,
	default: { start: jest.fn(), stop: jest.fn(), setForceSpeakerphoneOn: jest.fn() }
}));

jest.mock('react-native-webrtc', () => ({
	RTCAudioSession: { audioSessionDidActivate: jest.fn(), audioSessionDidDeactivate: jest.fn() }
}));

jest.mock('~/lib/native/NativeVoip', () => ({
	__esModule: true,
	default: {
		setSpeakerOn: jest.fn(() => Promise.resolve(true)),
		startAudioRouteSync: jest.fn(() => Promise.resolve()),
		stopAudioRouteSync: jest.fn(() => Promise.resolve())
	}
}));

const mockSetInputTrack = jest.fn(() => Promise.resolve());
const mockStartInputTrack = jest.fn(() => Promise.resolve());
let mockCurrentSession: unknown = null;

jest.mock('./MediaSessionStore', () => ({
	mediaSessionStore: {
		getCurrentInstance: () => mockCurrentSession
	}
}));

jest.mock('~/containers/ActionSheet', () => ({ hideActionSheetRef: jest.fn() }));
jest.mock('~/lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn(), back: jest.fn() }
}));
jest.mock('./playCallEndedSound', () => ({ playCallEndedSound: jest.fn() }));

function makeCall(callId: string, held = false) {
	return {
		callId,
		localParticipant: { muted: false, held, setMuted: jest.fn(), setHeld: jest.fn() },
		remoteParticipants: [],
		emitter: { on: jest.fn(), off: jest.fn() },
		hangup: jest.fn()
	} as any;
}

function bindCall(callId: string, overrides: Record<string, unknown> = {}) {
	const call = makeCall(callId);
	useCallStore.setState({ call, callId, nativeAcceptedCallId: null, isOnHold: false, isSpeakerOn: false, ...overrides });
	return call;
}

describe('voipAudioHandoff', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCurrentSession = { setInputTrack: mockSetInputTrack, startInputTrack: mockStartInputTrack };
		resetVoipAudioHandoff();
		useCallStore.setState({ call: null, callId: null, nativeAcceptedCallId: null, isOnHold: false, isSpeakerOn: false });
	});

	it('does nothing when there is no active call', async () => {
		await expect(yieldVoipAudio('test')).resolves.toBe(false);
		expect(isVoipAudioYielded()).toBe(false);
		expect(RNCallKeep.setOnHold).not.toHaveBeenCalled();
		expect(mockSetInputTrack).not.toHaveBeenCalled();
	});

	it('holds the call, drops the audio session and stops the capture track', async () => {
		const call = bindCall('uuid-1');

		await expect(yieldVoipAudio('jitsi')).resolves.toBe(true);

		expect(call.localParticipant.setHeld).toHaveBeenCalledWith(true);
		expect(useCallStore.getState().isOnHold).toBe(true);
		expect(RNCallKeep.setOnHold).toHaveBeenCalledWith('uuid-1', true);
		expect(InCallManager.stop).toHaveBeenCalled();
		expect(mockSetInputTrack).toHaveBeenCalledWith(null);
		expect(isVoipAudioYielded()).toBe(true);
	});

	it('is idempotent for the same call', async () => {
		bindCall('uuid-1');

		await yieldVoipAudio('jitsi');
		await expect(yieldVoipAudio('jitsi')).resolves.toBe(true);

		expect(RNCallKeep.setOnHold).toHaveBeenCalledTimes(1);
		expect(mockSetInputTrack).toHaveBeenCalledTimes(1);
	});

	it('works for a native-accepted call that has no callId yet', async () => {
		const call = makeCall('uuid-native');
		useCallStore.setState({ call, callId: null, nativeAcceptedCallId: 'uuid-native' });

		await expect(yieldVoipAudio('pexip')).resolves.toBe(true);
		expect(RNCallKeep.setOnHold).toHaveBeenCalledWith('uuid-native', true);
	});

	it('restores capture, audio session and hold on reclaim', async () => {
		const call = bindCall('uuid-1');
		await yieldVoipAudio('jitsi');

		await reclaimVoipAudio('jitsi');

		expect(mockStartInputTrack).toHaveBeenCalled();
		expect(InCallManager.start).toHaveBeenCalledWith({ media: 'audio' });
		expect(RNCallKeep.setOnHold).toHaveBeenCalledWith('uuid-1', false);
		expect(call.localParticipant.setHeld).toHaveBeenLastCalledWith(false);
		expect(RNCallKeep.setCurrentCallActive).toHaveBeenCalledWith('uuid-1');
		expect(useCallStore.getState().isOnHold).toBe(false);
		expect(isVoipAudioYielded()).toBe(false);
	});

	it('leaves a user-initiated hold in place on reclaim', async () => {
		const call = bindCall('uuid-1', { isOnHold: true });

		await yieldVoipAudio('jitsi');
		expect(call.localParticipant.setHeld).not.toHaveBeenCalled();

		await reclaimVoipAudio('jitsi');

		expect(RNCallKeep.setOnHold).not.toHaveBeenCalledWith('uuid-1', false);
		expect(call.localParticipant.setHeld).not.toHaveBeenCalledWith(false);
		expect(useCallStore.getState().isOnHold).toBe(true);
	});

	it('does not touch a call that ended while the videoconf was up', async () => {
		bindCall('uuid-1');
		await yieldVoipAudio('jitsi');
		jest.clearAllMocks();
		useCallStore.setState({ call: null, callId: null, nativeAcceptedCallId: null });

		await reclaimVoipAudio('jitsi');

		expect(mockStartInputTrack).not.toHaveBeenCalled();
		expect(RNCallKeep.setOnHold).not.toHaveBeenCalled();
	});

	it('does not touch a different call bound while the videoconf was up', async () => {
		bindCall('uuid-1');
		await yieldVoipAudio('jitsi');
		jest.clearAllMocks();
		bindCall('uuid-2');

		await reclaimVoipAudio('jitsi');

		expect(RNCallKeep.setOnHold).not.toHaveBeenCalled();
		expect(useCallStore.getState().isOnHold).toBe(false);
	});

	it('reclaims without a signaling session present', async () => {
		bindCall('uuid-1');
		await yieldVoipAudio('jitsi');
		mockCurrentSession = null;

		await expect(reclaimVoipAudio('jitsi')).resolves.toBeUndefined();
		expect(RNCallKeep.setOnHold).toHaveBeenCalledWith('uuid-1', false);
	});
});

/** `reclaimVoipAudio` awaits the capture restore before touching CallKit. */
async function flushReclaim(): Promise<void> {
	for (let i = 0; i < 6; i++) {
		// eslint-disable-next-line no-await-in-loop
		await Promise.resolve();
	}
}

describe('voipAudioHandoff — out-of-app reclaim', () => {
	let listener: ((state: string) => void) | null = null;
	const remove = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockCurrentSession = { setInputTrack: mockSetInputTrack, startInputTrack: mockStartInputTrack };
		resetVoipAudioHandoff();
		useCallStore.setState({ call: null, callId: null, nativeAcceptedCallId: null, isOnHold: false, isSpeakerOn: false });
		listener = null;
		Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
		jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (state: string) => void) => {
			listener = cb;
			return { remove } as any;
		}) as any);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('reclaims when the app comes back to the foreground', async () => {
		bindCall('uuid-1');
		await yieldVoipAudio('pexip');

		reclaimVoipAudioOnAppReturn('pexip');
		listener?.('background');
		jest.advanceTimersByTime(5000);
		listener?.('active');
		await flushReclaim();

		expect(RNCallKeep.setOnHold).toHaveBeenCalledWith('uuid-1', false);
	});

	it('ignores a foreground event that was never preceded by a background one', async () => {
		bindCall('uuid-1');
		await yieldVoipAudio('pexip');
		jest.clearAllMocks();

		reclaimVoipAudioOnAppReturn('pexip');
		listener?.('active');
		await flushReclaim();

		expect(RNCallKeep.setOnHold).not.toHaveBeenCalled();
	});

	it('falls back to reclaiming when nothing ever backgrounded the app', async () => {
		bindCall('uuid-1');
		await yieldVoipAudio('pexip');
		jest.clearAllMocks();

		reclaimVoipAudioOnAppReturn('pexip');
		jest.advanceTimersByTime(750);
		await flushReclaim();

		expect(RNCallKeep.setOnHold).toHaveBeenCalledWith('uuid-1', false);
	});

	it('does nothing when no handoff is in flight', () => {
		reclaimVoipAudioOnAppReturn('pexip');
		expect(AppState.addEventListener).not.toHaveBeenCalled();
	});
});
