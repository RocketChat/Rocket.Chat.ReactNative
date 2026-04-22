// app/containers/NewMediaCall/VoipCallLifecycle.integration.test.tsx
//
// Integration tests covering the VoIP call lifecycle across real handlers in
// MediaSessionInstance and useCallStore:
//   - Outgoing (press Call → startCall → newCall → setCall + navigate)
//   - Incoming (DDP accepted signal → answerCall → setCall + navigate)
//   - Hang up (UI endCall and MediaSessionInstance.endCall ringing/active branches)
//   - In-call controls (mute, hold, trackStateChange sync)
//
// Seam: @rocket.chat/media-signaling is mocked at the SDK boundary (see block
// comment on the jest.mock below). Everything between that mock and the UI —
// MediaSessionInstance, useCallStore, NewMediaCall, CallView — runs as real code.

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { NewMediaCall } from './NewMediaCall';
import CallView from '../../views/CallView';
import Navigation from '../../lib/navigation/appNavigation';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import { mediaSessionInstance } from '../../lib/services/voip/MediaSessionInstance';
import { mockedStore } from '../../reducers/mockedStore';
import type { TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import type { InsideStackParamList } from '../../stacks/types';
import type { IDDPMessage } from '../../definitions/IDDPMessage';

// Compile-time guard — fails tsc if 'CallView' is removed from InsideStackParamList.
const assertType = <_T extends true>(_?: _T): void => {};
assertType<InsideStackParamList extends { CallView: unknown } ? true : false>();

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock-prefixed holder for the captured sdk.onStreamData handler.
// Jest hoists jest.mock() to the top of the module; factories can only close
// over variables whose names start with "mock". Wrapping in an object lets us
// reassign across the beforeEach without recreating the module mock.
const mockSdkState: { streamHandler: ((msg: IDDPMessage) => void) | null } = { streamHandler: null };

jest.mock('../../lib/database', () => ({
	db: { get: jest.fn() },
	active: { get: jest.fn() }
}));
jest.mock('../../lib/database/services/Subscription', () => ({
	getDMSubscriptionByUsername: jest.fn().mockResolvedValue(null)
}));
jest.mock('../../lib/methods/helpers/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'other-user-id')
}));
jest.mock('../../lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: { navigate: jest.fn(), back: jest.fn() }
}));
jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		// Capture the stream handler so tests can drive DDP signals directly —
		// the real path is sdk.onStreamData → handler → this.instance.processSignal.
		onStreamData: jest.fn((_name: string, handler: (msg: IDDPMessage) => void) => {
			mockSdkState.streamHandler = handler;
			return { stop: jest.fn() };
		}),
		methodCall: jest.fn()
	}
}));
jest.mock('../../lib/store/auxStore', () => ({
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
// useCallStore.setCall/reset call InCallManager.start/stop; without this mock
// those calls throw and the real error path goes through console.error, which
// the narrow spy below would flag as unknown noise.
jest.mock('react-native-incall-manager', () => ({
	__esModule: true,
	default: {
		start: jest.fn(),
		stop: jest.fn(),
		setForceSpeakerphoneOn: jest.fn().mockResolvedValue(undefined)
	}
}));
jest.mock('../../lib/methods/helpers/fileDownload', () => ({
	fileDownload: jest.fn(),
	fileDownloadAndPreview: jest.fn()
}));
jest.mock('react-native-device-info', () => ({
	__esModule: true,
	default: {
		getUniqueId: jest.fn(() => 'test-device-id'),
		getUniqueIdSync: jest.fn(() => 'test-device-id'),
		hasNotch: () => false,
		getReadableVersion: () => '1.0.0',
		getVersion: () => '1.0.0',
		getBuildNumber: () => '1',
		getBundleId: () => 'com.rocket.chat',
		getModel: () => 'iPhone',
		getSystemVersion: () => '14.0',
		isTablet: () => false
	},
	getUniqueId: jest.fn(() => 'test-device-id'),
	getUniqueIdSync: jest.fn(() => 'test-device-id'),
	hasNotch: () => false,
	getReadableVersion: () => '1.0.0',
	getVersion: () => '1.0.0',
	getBuildNumber: () => '1',
	getBundleId: () => 'com.rocket.chat',
	getModel: () => 'iPhone',
	getSystemVersion: () => '14.0',
	isTablet: () => false
}));
jest.mock('../../lib/native/NativeVoip', () => ({
	__esModule: true,
	default: { stopNativeDDPClient: jest.fn() }
}));
jest.mock('../../lib/methods/voipPhoneStatePermission', () => ({
	requestPhoneStatePermission: jest.fn()
}));
jest.mock('../../lib/hooks/useIsScreenReaderEnabled', () => ({
	useIsScreenReaderEnabled: jest.fn(() => false)
}));
// PeerList/FilterHeader/SelectedPeer import Avatar → database → appGroup (native module).
// Not part of the integration contract (button → MediaSessionInstance → CallView).
jest.mock('./PeerList', () => ({ PeerList: () => null }));
jest.mock('./FilterHeader', () => ({ FilterHeader: () => null }));
jest.mock('./SelectedPeer', () => ({ SelectedPeer: () => null }));
// getPeerAutocompleteOptions → restApi → @rocket.chat/mobile-crypto (ESM, not transformable).
jest.mock('../../lib/services/voip/getPeerAutocompleteOptions', () => ({
	getPeerAutocompleteOptions: jest.fn().mockResolvedValue([])
}));
// navigateToCallRoom → goRoom → restApi → encryption → ESM fail.
jest.mock('../../lib/services/voip/navigateToCallRoom', () => ({
	navigateToCallRoom: jest.fn().mockResolvedValue(undefined)
}));

const mockHideActionSheet = jest.fn();
jest.mock('../ActionSheet', () => ({
	hideActionSheetRef: () => mockHideActionSheet(),
	showActionSheetRef: jest.fn()
}));

// ─── Real emitter factory ─────────────────────────────────────────────────────
// Prefixed 'mock' so jest.mock() factories can reference it (jest hoisting rule).
// Used for call.emitter so handlers registered via on() actually run when emit()
// is called — lets tests assert downstream effects rather than call counts.

function mockCallEmitter() {
	const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
	return {
		on(event: string, handler: (...args: unknown[]) => void): void {
			if (!listeners[event]) listeners[event] = [];
			listeners[event].push(handler);
		},
		off(event: string, handler: (...args: unknown[]) => void): void {
			if (listeners[event]) {
				listeners[event] = listeners[event].filter(h => h !== handler);
			}
		},
		emit(event: string, ...args: unknown[]): void {
			listeners[event]?.forEach(h => h(...args));
		}
	};
}

// ─── Media-signaling mock ─────────────────────────────────────────────────────
//
// @rocket.chat/media-signaling (WebRTC stack) is fully mocked here. These tests
// exercise signaling orchestration, Zustand, and navigation — not real peer
// connections, ICE, or media tracks. Catching regressions in WebRTC-specific
// behavior still requires device or E2E coverage outside Jest.

type MockMediaSignalingSession = {
	userId: string;
	sessionId: string;
	endSession: jest.Mock;
	on: jest.Mock;
	emit: (event: string, payload: unknown) => void;
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
			const handlers: Record<string, ((payload: unknown) => void)[]> = {};

			this.userId = config.userId;
			this.endSession = jest.fn();

			this.on = jest.fn().mockImplementation((event: string, handler: (payload: unknown) => void) => {
				if (!handlers[event]) handlers[event] = [];
				handlers[event].push(handler);
			});

			this.emit = (event: string, payload: unknown) => {
				handlers[event]?.forEach(h => h(payload));
			};

			this.processSignal = jest.fn().mockResolvedValue(undefined);
			this.setIceGatheringTimeout = jest.fn();

			// Integration seam: startCall fires 'newCall' with a synthetic outgoing call.
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;
			this.startCall = jest.fn().mockImplementation((_actor: string, userId: string) => {
				const call: IClientMediaCall = {
					callId: `call-${userId}`,
					hidden: false,
					state: 'ringing',
					localParticipant: {
						local: true,
						role: 'caller',
						muted: false,
						held: false,
						contact: {},
						setMuted: jest.fn(),
						setHeld: jest.fn()
					},
					remoteParticipants: [{ local: false, role: 'callee', muted: false, held: false, contact: {} }],
					reject: jest.fn(),
					hangup: jest.fn(),
					sendDTMF: jest.fn(),
					emitter: mockCallEmitter() as unknown as IClientMediaCall['emitter']
				} as unknown as IClientMediaCall;
				self.emit('newCall', { call });
				return Promise.resolve();
			});

			this.getCallData = jest.fn();
			Object.defineProperty(this, 'sessionId', { value: `session-${config.userId}`, writable: false });
			createdSessions.push(this);
		})
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Unified call factory — covers all test call creation needs.
// setMuted/setHeld for controls tests; accept for answerCall; hangup/reject for endCall.
function makeCall(overrides: {
	callId?: string;
	state?: 'ringing' | 'active' | 'accepted' | 'ended' | 'none';
	role?: 'caller' | 'callee';
	hidden?: boolean;
	remoteMuted?: boolean;
	remoteHeld?: boolean;
}): IClientMediaCall {
	const callId = overrides.callId ?? 'default-call';
	return {
		callId,
		hidden: overrides.hidden ?? false,
		state: overrides.state ?? 'ringing',
		localParticipant: {
			local: true,
			role: overrides.role ?? 'callee',
			muted: false,
			held: false,
			contact: {},
			setMuted: jest.fn(),
			setHeld: jest.fn()
		},
		remoteParticipants: [
			{
				local: false,
				role: overrides.role === 'caller' ? 'callee' : 'caller',
				muted: overrides.remoteMuted ?? false,
				held: overrides.remoteHeld ?? false,
				contact: { displayName: 'Remote', username: 'remote', sipExtension: '' }
			}
		],
		accept: jest.fn().mockResolvedValue(undefined),
		reject: jest.fn(),
		hangup: jest.fn(),
		sendDTMF: jest.fn(),
		emitter: mockCallEmitter() as unknown as IClientMediaCall['emitter']
	} as unknown as IClientMediaCall;
}

// Drive the same payload shape the production DDP listener expects.
// Wraps the signal in an IDDPMessage and invokes the captured handler.
function emitDDPMediaSignal(signal: Record<string, unknown>): void {
	if (!mockSdkState.streamHandler) {
		throw new Error('emitDDPMediaSignal called before sdk.onStreamData registered a handler');
	}
	mockSdkState.streamHandler({
		fields: { eventName: 'test-device-id/media-signal', args: [signal] }
	} as unknown as IDDPMessage);
}

function setSelectedPeer(peer: TPeerItem): void {
	usePeerAutocompleteStore.setState({ selectedPeer: peer, options: [], filter: '' });
}

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

// Flushes the microtask queue (answerCall uses async handlers).
const flushMicrotasks = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

// ─── Console-error handling ───────────────────────────────────────────────────
//
// Replaces the previous blanket `jest.spyOn(console, 'error').mockImplementation(() => {})`
// with a narrow allowlist. Known noise substrings are documented below; any
// other console.error/warn causes the test to fail. This surfaces real act()
// warnings and new bugs instead of hiding them.
//
// Known-noise allowlist:
//   - '@expo/vector-icons' Icon warn: fires on CallView render because the
//     icon font has not been loaded in the Jest environment. 3rd-party.
//   - 'not wrapped in act(...)' warnings tied to the Icon class component's
//     render inside <CallView /> — same root cause as above.
//   - 'is not a valid icon name' — CallView's CustomIcon reports missing
//     glyph entries (e.g. 'pause-shape-unfilled') in the Jest env; glyph map
//     is not loaded. Rendering succeeds, warning is cosmetic for tests.
//   - '[VoIP] Call not found after accept:' — deterministic expected branch output of
//     answerCall when getCallData returns undefined (exercised by test A2).
//     Production code warns intentionally; tests should not hide it, but it
//     is not an unexpected error for the asserting test.
const CONSOLE_ERROR_ALLOWLIST: string[] = [];
const CONSOLE_WARN_ALLOWLIST: string[] = [
	'@expo/vector-icons',
	'not wrapped in act',
	'is not a valid icon name',
	'[VoIP] Call not found after accept:'
];

let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;
let unexpectedConsoleErrors: string[] = [];

function formatConsoleArgs(args: unknown[]): string {
	return args
		.map(a => {
			if (a instanceof Error) return a.message;
			if (typeof a === 'string') return a;
			try {
				return JSON.stringify(a);
			} catch {
				return String(a);
			}
		})
		.join(' ');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VoIP call lifecycle (integration)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		createdSessions.length = 0;
		mockSdkState.streamHandler = null;
		unexpectedConsoleErrors = [];
		usePeerAutocompleteStore.getState().reset();
		useCallStore.getState().reset();
		mediaSessionInstance.reset();

		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
			const message = formatConsoleArgs(args);
			if (CONSOLE_ERROR_ALLOWLIST.some(allowed => message.includes(allowed))) return;
			unexpectedConsoleErrors.push(`[error] ${message}`);
		});
		consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
			const message = formatConsoleArgs(args);
			if (CONSOLE_WARN_ALLOWLIST.some(allowed => message.includes(allowed))) return;
			unexpectedConsoleErrors.push(`[warn] ${message}`);
		});

		mediaSessionInstance.init('me');
		if (createdSessions.length !== 1) {
			throw new Error(`Expected exactly one media session after init, got ${createdSessions.length}`);
		}
		mockHideActionSheet.mockClear();
	});

	afterEach(() => {
		consoleErrorSpy?.mockRestore();
		consoleWarnSpy?.mockRestore();
		consoleErrorSpy = undefined;
		consoleWarnSpy = undefined;
		act(() => {
			mediaSessionInstance.reset();
		});
		if (unexpectedConsoleErrors.length > 0) {
			const joined = unexpectedConsoleErrors.join('\n  - ');
			throw new Error(`Unexpected console.error/warn in test:\n  - ${joined}`);
		}
	});

	// ── Outgoing calls (button press path) ───────────────────────────────────

	it('user peer: press Call → startCall fires newCall → navigates to CallView', async () => {
		setSelectedPeer({ type: 'user', value: 'user-1', label: 'Alice', username: 'alice' });
		const session = createdSessions[createdSessions.length - 1];

		const { getByTestId } = render(
			<Wrapper>
				<NewMediaCall />
			</Wrapper>
		);

		// The entire pipeline runs from this single press:
		//   CreateCall.handleCall → mediaSessionInstance.startCall('user-1', 'user')
		//   → session.startCall('user', 'user-1') [args reversed for SDK]
		//   → mock fires 'newCall' → MediaSessionInstance handler
		//   → useCallStore.setCall + Navigation.navigate('CallView')
		fireEvent.press(getByTestId('new-media-call-button'));
		await act(() => Promise.resolve());

		expect(session.startCall).toHaveBeenCalledWith('user', 'user-1');
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
		expect(mockHideActionSheet).toHaveBeenCalledTimes(1);

		const { call } = useCallStore.getState();
		expect(call?.callId).toBe('call-user-1');

		// Firing 'ended' triggers RNCallKeep cleanup and navigation back via real handlers.
		act(() => {
			(call!.emitter as unknown as ReturnType<typeof mockCallEmitter>).emit('ended');
		});
		expect(RNCallKeep.endCall as jest.Mock).toHaveBeenCalledWith('call-user-1');
		expect(Navigation.back).toHaveBeenCalled();
	});

	it('SIP peer: press Call → startCall(sip, number) → navigates to CallView', () => {
		setSelectedPeer({ type: 'sip', value: '+5511999999999', label: '+55 11 99999-9999' });
		const session = createdSessions[createdSessions.length - 1];

		const { getByTestId } = render(
			<Wrapper>
				<NewMediaCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));

		expect(session.startCall).toHaveBeenCalledWith('sip', '+5511999999999');
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
		expect(useCallStore.getState().call?.callId).toBe('call-+5511999999999');
	});

	it('no peer selected: button disabled, startCall not called, action sheet stays open', () => {
		const session = createdSessions[createdSessions.length - 1];

		const { getByTestId } = render(
			<Wrapper>
				<NewMediaCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));

		expect(getByTestId('new-media-call-button').props.accessibilityState?.disabled).toBe(true);
		expect(session.startCall).not.toHaveBeenCalled();
		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(useCallStore.getState().call).toBeNull();
		expect(mockHideActionSheet).not.toHaveBeenCalled();
	});

	// ── newCall handler branches (incoming / SDK-driven path) ─────────────────

	it('hidden call: newCall with hidden=true does not navigate or populate store', () => {
		const session = createdSessions[createdSessions.length - 1];
		const hiddenCall = makeCall({ callId: 'hidden-1', hidden: true, role: 'caller' });

		act(() => {
			session.emit('newCall', { call: hiddenCall });
		});

		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(useCallStore.getState().call).toBeNull();
	});

	it('callee role: newCall does not navigate (incoming calls route via answerCall)', () => {
		const session = createdSessions[createdSessions.length - 1];
		const incomingCall = makeCall({ callId: 'incoming-1', role: 'callee' });

		act(() => {
			session.emit('newCall', { call: incomingCall });
		});

		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(useCallStore.getState().call).toBeNull();
	});

	// ── CallView render contract ──────────────────────────────────────────────

	it('setCall populates store and CallView renders; clearing store unmounts it', () => {
		const call = makeCall({ callId: 'c-render', state: 'active', role: 'caller' });

		act(() => {
			useCallStore.getState().setCall(call);
		});

		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByTestId('call-view-container')).toBeTruthy();

		act(() => {
			useCallStore.setState({ call: null });
		});
		expect(queryByTestId('call-view-container')).toBeNull();
	});

	// ── MediaSessionInstance contract: answerCall ────────────────────────────

	describe('MediaSessionInstance contract: answerCall', () => {
		it('A1: DDP accepted signal with native pre-accept → answerCall navigates to CallView', async () => {
			const session = createdSessions[createdSessions.length - 1];
			const mainCall = makeCall({ callId: 'incoming-1', role: 'callee' });
			session.getCallData.mockReturnValue(mainCall);

			act(() => {
				useCallStore.getState().setNativeAcceptedCallId('incoming-1');
			});

			await act(async () => {
				emitDDPMediaSignal({
					type: 'notification',
					notification: 'accepted',
					signedContractId: 'test-device-id',
					callId: 'incoming-1'
				});
				// Flush the answerCall() microtask queue.
				await flushMicrotasks();
			});

			expect(RNCallKeep.setCurrentCallActive as jest.Mock).toHaveBeenCalledWith('incoming-1');
			expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
			expect(useCallStore.getState().call?.callId).toBe('incoming-1');
		});

		it('A2: accepted signal but call not found → RNCallKeep.endCall, no navigate', async () => {
			const session = createdSessions[createdSessions.length - 1];
			session.getCallData.mockReturnValue(undefined);

			act(() => {
				useCallStore.getState().setNativeAcceptedCallId('missing-1');
			});

			await act(async () => {
				emitDDPMediaSignal({
					type: 'notification',
					notification: 'accepted',
					signedContractId: 'test-device-id',
					callId: 'missing-1'
				});
				await flushMicrotasks();
			});

			expect(RNCallKeep.endCall as jest.Mock).toHaveBeenCalledWith('missing-1');
			expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();
			expect(Navigation.navigate).not.toHaveBeenCalled();
			expect(useCallStore.getState().call).toBeNull();
			// Tighten: confirm the known-noise allowlist entry was actually triggered.
			expect(consoleWarnSpy).toHaveBeenCalledWith('[VoIP] Call not found after accept:', 'missing-1');
		});

		it('A3: idempotency — existing call matches callId, answerCall early-returns', async () => {
			// Test-pollution guard: confirms the outer reset() actually cleared state.
			expect(useCallStore.getState().nativeAcceptedCallId).toBeNull();

			const session = createdSessions[createdSessions.length - 1];
			const existingCall = makeCall({ callId: 'incoming-1', role: 'callee' });
			act(() => {
				useCallStore.getState().setCall(existingCall);
			});
			(Navigation.navigate as jest.Mock).mockClear();
			(RNCallKeep.setCurrentCallActive as jest.Mock).mockClear();

			await act(async () => {
				await mediaSessionInstance.answerCall('incoming-1');
			});

			// getCallData is the SDK boundary — confirming it was never hit proves
			// the early-return branch ran before any SDK interaction.
			expect(session.getCallData).not.toHaveBeenCalled();
			expect(Navigation.navigate).not.toHaveBeenCalled();
			expect(RNCallKeep.setCurrentCallActive as jest.Mock).not.toHaveBeenCalled();
		});
	});

	// The CallView end button wires to useCallStore.endCall (see
	// app/views/CallView/components/CallButtons.tsx), NOT MediaSessionInstance.endCall.
	// The latter is invoked from native CallKit "end" events. Both need coverage.
	describe('UI store contract: Hang up', () => {
		it('B1: useCallStore.endCall clears store and triggers RNCallKeep.endCall', () => {
			setSelectedPeer({ type: 'user', value: 'user-1', label: 'Alice', username: 'alice' });
			const { getByTestId } = render(
				<Wrapper>
					<NewMediaCall />
				</Wrapper>
			);
			// Real press path wires listeners via setCall.
			fireEvent.press(getByTestId('new-media-call-button'));
			expect(useCallStore.getState().call?.callId).toBe('call-user-1');

			act(() => {
				useCallStore.getState().endCall();
			});

			expect(RNCallKeep.endCall as jest.Mock).toHaveBeenCalledWith('call-user-1');
			expect(InCallManager.stop as jest.Mock).toHaveBeenCalled();
			expect(useCallStore.getState().call).toBeNull();
			expect(useCallStore.getState().callId).toBeNull();
		});

		it('B2: MediaSessionInstance.endCall during active state → RNCallKeep cleanup, store reset', () => {
			const session = createdSessions[createdSessions.length - 1];
			const activeCall = makeCall({ callId: 'active-1', state: 'active' });
			session.getCallData.mockReturnValue(activeCall);

			act(() => {
				mediaSessionInstance.endCall('active-1');
			});

			expect(RNCallKeep.endCall as jest.Mock).toHaveBeenCalledWith('active-1');
			expect(RNCallKeep.setCurrentCallActive as jest.Mock).toHaveBeenCalledWith('');
			expect(RNCallKeep.setAvailable as jest.Mock).toHaveBeenCalledWith(true);
			expect(useCallStore.getState().call).toBeNull();
		});

		it('B3: MediaSessionInstance.endCall during ringing → reject (not hangup) + RNCallKeep cleanup', () => {
			const session = createdSessions[createdSessions.length - 1];
			const ringingCall = makeCall({ callId: 'ringing-1' });
			session.getCallData.mockReturnValue(ringingCall);

			act(() => {
				mediaSessionInstance.endCall('ringing-1');
			});

			expect(ringingCall.reject).toHaveBeenCalled();
			expect(ringingCall.hangup).not.toHaveBeenCalled();
			expect(RNCallKeep.endCall as jest.Mock).toHaveBeenCalledWith('ringing-1');
			expect(useCallStore.getState().call).toBeNull();
		});
	});

	// ── UI store contract: In-call controls (mute / hold) ────────────────────

	describe('UI store contract: In-call controls (mute/hold)', () => {
		it('C1: toggleMute flips store isMuted; second toggle restores it', () => {
			const call = makeCall({ callId: 'ctrl-mute', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});
			expect(useCallStore.getState().isMuted).toBe(false);

			act(() => {
				useCallStore.getState().toggleMute();
			});
			expect(useCallStore.getState().isMuted).toBe(true);

			act(() => {
				useCallStore.getState().toggleMute();
			});
			expect(useCallStore.getState().isMuted).toBe(false);
		});

		it('C2: toggleHold flips store isOnHold; second toggle restores it', () => {
			const call = makeCall({ callId: 'ctrl-hold', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});
			expect(useCallStore.getState().isOnHold).toBe(false);

			act(() => {
				useCallStore.getState().toggleHold();
			});
			expect(useCallStore.getState().isOnHold).toBe(true);

			act(() => {
				useCallStore.getState().toggleHold();
			});
			expect(useCallStore.getState().isOnHold).toBe(false);
		});

		it('C3: trackStateChange emission syncs store from call participant state', () => {
			const call = makeCall({ callId: 'ctrl-track', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});
			expect(useCallStore.getState().isMuted).toBe(false);
			expect(useCallStore.getState().remoteHeld).toBe(false);

			// Mutate the call's state the way the SDK would before dispatching the event.
			// The SDK types flag these fields as readonly; tests cast through
			// Record<string, unknown> because we're standing in for the SDK here.
			(call.localParticipant as unknown as Record<string, unknown>).muted = true;
			(call.remoteParticipants[0] as unknown as Record<string, unknown>).held = true;

			act(() => {
				(call.emitter as unknown as ReturnType<typeof mockCallEmitter>).emit('trackStateChange');
			});

			expect(useCallStore.getState().isMuted).toBe(true);
			expect(useCallStore.getState().remoteHeld).toBe(true);
			expect(useCallStore.getState().controlsVisible).toBe(true);
		});

		it('C4: toggleSpeaker flips store isSpeakerOn via InCallManager', async () => {
			const call = makeCall({ callId: 'ctrl-speaker', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});
			expect(useCallStore.getState().isSpeakerOn).toBe(false);

			await act(async () => {
				await useCallStore.getState().toggleSpeaker();
			});
			expect(InCallManager.setForceSpeakerphoneOn as jest.Mock).toHaveBeenCalledWith(true);
			expect(useCallStore.getState().isSpeakerOn).toBe(true);

			await act(async () => {
				await useCallStore.getState().toggleSpeaker();
			});
			expect(InCallManager.setForceSpeakerphoneOn as jest.Mock).toHaveBeenCalledWith(false);
			expect(useCallStore.getState().isSpeakerOn).toBe(false);
		});
	});

	// Closes the loop: render real CallView, press actual buttons, assert store flip + SDK call.
	describe('CallView button wiring (UI → store → SDK)', () => {
		it('D1: press mute button → participant.setMuted invoked, store flips', () => {
			const call = makeCall({ callId: 'btn-mute', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});

			const { getByTestId } = render(
				<Wrapper>
					<CallView />
				</Wrapper>
			);

			act(() => {
				fireEvent.press(getByTestId('call-view-mute'));
			});

			expect(call.localParticipant.setMuted).toHaveBeenCalledWith(true);
			expect(useCallStore.getState().isMuted).toBe(true);
		});

		it('D2: press hold button → participant.setHeld invoked, store flips', () => {
			const call = makeCall({ callId: 'btn-hold', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});

			const { getByTestId } = render(
				<Wrapper>
					<CallView />
				</Wrapper>
			);

			act(() => {
				fireEvent.press(getByTestId('call-view-hold'));
			});

			expect(call.localParticipant.setHeld).toHaveBeenCalledWith(true);
			expect(useCallStore.getState().isOnHold).toBe(true);
		});

		it('D3: press end button → call.hangup, RNCallKeep.endCall, store cleared', () => {
			const call = makeCall({ callId: 'btn-end', role: 'caller', state: 'active' });
			act(() => {
				useCallStore.getState().setCall(call);
			});

			const { getByTestId } = render(
				<Wrapper>
					<CallView />
				</Wrapper>
			);

			act(() => {
				fireEvent.press(getByTestId('call-view-end'));
			});

			expect(call.hangup).toHaveBeenCalled();
			expect(RNCallKeep.endCall as jest.Mock).toHaveBeenCalledWith('btn-end');
			expect(useCallStore.getState().call).toBeNull();
		});
	});

	// Covers the handleStateChange listener wired by setCall in useCallStore.ts:169.
	// Specifically the ringing → active transition that records callStartTime and
	// tells iOS CallKit to surface the call. Pure unit tests miss this cross-module handoff.
	describe('Call state transitions', () => {
		it('E1: stateChange ringing → active sets callStartTime + RNCallKeep.setCurrentCallActive', () => {
			const call = makeCall({ callId: 'state-1', role: 'caller', state: 'ringing' });
			act(() => {
				useCallStore.getState().setCall(call);
			});
			expect(useCallStore.getState().callState).toBe('ringing');
			expect(useCallStore.getState().callStartTime).toBeNull();
			(RNCallKeep.setCurrentCallActive as jest.Mock).mockClear();

			// SDK mutates the underlying call before emitting (state is readonly in types,
			// but the SDK owns this object — tests cast through Record to stand in).
			(call as unknown as Record<string, unknown>).state = 'active';
			act(() => {
				(call.emitter as unknown as ReturnType<typeof mockCallEmitter>).emit('stateChange', 'ringing');
			});

			expect(useCallStore.getState().callState).toBe('active');
			expect(useCallStore.getState().callStartTime).not.toBeNull();
			expect(RNCallKeep.setCurrentCallActive as jest.Mock).toHaveBeenCalledWith('state-1');
		});
	});

	// startCall rejection path — deferred to Phase 3.
	// MediaSessionInstance.ts:151-155 does not `await` or `.catch` the SDK's
	// startCall promise, so a rejection leaks as an unhandled rejection. Phase 3
	// will land the `.catch` first, then add the rejection-path integration test.
	//
	// Native CallKit event tests (RNCallKeep.addEventListener('endCall' / 'didPerform...')
	// from MediaCallEvents.ts) — also deferred. They require:
	//   - Platform mock to force isIOS branch (listener registration is platform-gated)
	//   - Isolation of the deepLinkingOpen saga dispatch (real Redux store import in
	//     MediaCallEvents.ts vs mockedStore in this Provider)
	//   - Capture seam for RNCallKeep.addEventListener handlers
	// Worth a small helper module before adding the tests.
});
