// app/containers/NewMediaCall/NewMediaCall.integration.test.tsx
//
// Integration test: CreateCall button press → MediaSessionInstance → CallView.
//
// Seam: @rocket.chat/media-signaling is mocked at the SDK boundary.
// The mock MediaSignalingSession simulates the real SDK's async behaviour:
//   session.startCall(actor, userId) → fires 'newCall' with a synthetic call.
// This closes the causal chain — fireEvent.press alone causes Navigation.navigate.
//
// Real code running: MediaSessionInstance, useCallStore, NewMediaCall, CallView.
// Mocked at boundary: MediaSignalingSession (SDK), Navigation, RNCallKeep,
//   DDP SDK, WebRTC, native device modules (not available in Jest).

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import RNCallKeep from 'react-native-callkeep';
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

// Compile-time guard — fails tsc if 'CallView' is removed from InsideStackParamList.
const assertType = <_T extends true>(_?: _T): void => {};
assertType<InsideStackParamList extends { CallView: unknown } ? true : false>();

// ─── Mocks ────────────────────────────────────────────────────────────────────

let consoleErrorSpy: ReturnType<typeof jest.spyOn> | undefined;
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
		onStreamData: jest.fn(() => ({ stop: jest.fn() })),
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
jest.mock('../../lib/methods/helpers/fileDownload', () => ({
	fileDownload: jest.fn(),
	fileDownloadAndPreview: jest.fn()
}));
jest.mock('react-native-device-info', () => ({
	__esModule: true,
	default: {
		getUniqueId: jest.fn(() => 'test-device-id'),
		getUniqueIdSync: jest.fn(() => 'test-device-id'),
		hasNotch: jest.fn(() => false),
		getReadableVersion: jest.fn(() => '1.0.0'),
		getBundleId: jest.fn(() => 'com.rocket.chat'),
		getModel: jest.fn(() => 'iPhone'),
		getSystemVersion: jest.fn(() => '14.0'),
		isTablet: jest.fn(() => false)
	},
	getUniqueId: jest.fn(() => 'test-device-id'),
	getUniqueIdSync: jest.fn(() => 'test-device-id'),
	hasNotch: jest.fn(() => false),
	getReadableVersion: jest.fn(() => '1.0.0'),
	getBundleId: jest.fn(() => 'com.rocket.chat'),
	getModel: jest.fn(() => 'iPhone'),
	getSystemVersion: jest.fn(() => '14.0'),
	isTablet: jest.fn(() => false)
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
// Key design: on() maintains a real handler registry so that session.emit()
// dispatches to registered handlers. startCall(actor, userId) fires 'newCall'
// synchronously, simulating the SDK's response after WebRTC negotiation.
// session.emit() lets tests drive incoming-call and branch scenarios directly.

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

			// Allows tests to simulate incoming-call and branch scenarios.
			this.emit = (event: string, payload: unknown) => {
				handlers[event]?.forEach(h => h(payload));
			};

			this.processSignal = jest.fn().mockResolvedValue(undefined);
			this.setIceGatheringTimeout = jest.fn();

			// Integration seam: startCall fires 'newCall' with a synthetic outgoing call,
			// connecting fireEvent.press → startCall → newCall → setCall + navigate.
			const self = this;
			this.startCall = jest.fn().mockImplementation((_actor: string, userId: string) => {
				const call: IClientMediaCall = {
					callId: `call-${userId}`,
					hidden: false,
					state: 'ringing',
					localParticipant: { local: true, role: 'caller', muted: false, held: false, contact: {} },
					remoteParticipants: [{ local: false, role: 'callee', muted: false, held: false, contact: {} }],
					reject: jest.fn(),
					hangup: jest.fn(),
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

function makeIncomingCall(options: {
	callId?: string;
	role?: 'caller' | 'callee';
	hidden?: boolean;
}): IClientMediaCall {
	return {
		callId: options.callId ?? 'incoming-call',
		hidden: options.hidden ?? false,
		state: 'ringing',
		localParticipant: { local: true, role: options.role ?? 'callee', muted: false, held: false, contact: {} },
		remoteParticipants: [{ local: false, role: options.role === 'caller' ? 'callee' : 'caller', muted: false, held: false, contact: {} }],
		reject: jest.fn(),
		hangup: jest.fn(),
		emitter: mockCallEmitter() as unknown as IClientMediaCall['emitter']
	} as unknown as IClientMediaCall;
}

function setSelectedPeer(peer: TPeerItem): void {
	usePeerAutocompleteStore.setState({ selectedPeer: peer, options: [], filter: '' });
}

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NewMediaCall → CallView (integration)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		createdSessions.length = 0;
		usePeerAutocompleteStore.getState().reset();
		useCallStore.getState().reset();
		mediaSessionInstance.reset();
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		mediaSessionInstance.init('me');
		if (createdSessions.length !== 1) {
			throw new Error(`Expected exactly one media session after init, got ${createdSessions.length}`);
		}
		mockHideActionSheet.mockClear();
	});

	afterEach(() => {
		consoleErrorSpy?.mockRestore();
		consoleErrorSpy = undefined;
		mediaSessionInstance.reset();
	});

	// ── Outgoing calls (button press path) ───────────────────────────────────

	it('user peer: press Call → startCall fires newCall → navigates to CallView', () => {
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

		// SDK-boundary: args are (actor, userId) — reversed from the public API
		expect(session.startCall).toHaveBeenCalledWith('user', 'user-1');
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');
		expect(mockHideActionSheet).toHaveBeenCalledTimes(1);

		const call = useCallStore.getState().call;
		expect(call?.callId).toBe('call-user-1');

		// Behavioral: firing 'ended' triggers RNCallKeep cleanup and navigation back.
		// Real emitter dispatches to both handlers wired by MediaSessionInstance and useCallStore.
		(call!.emitter as unknown as ReturnType<typeof mockCallEmitter>).emit('ended');
		expect((RNCallKeep.endCall as jest.Mock)).toHaveBeenCalledWith('call-user-1');
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
	// These scenarios are triggered by the DDP listener in MediaSessionInstance,
	// not by button press. We drive them via session.emit('newCall', ...) which
	// exercises the same registered handler as the real DDP path.

	it('hidden call: newCall with hidden=true does not navigate or populate store', () => {
		const session = createdSessions[createdSessions.length - 1];
		const hiddenCall = makeIncomingCall({ callId: 'hidden-1', hidden: true, role: 'caller' });

		session.emit('newCall', { call: hiddenCall });

		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(useCallStore.getState().call).toBeNull();
	});

	it('callee role: newCall does not navigate (incoming calls route via answerCall)', () => {
		const session = createdSessions[createdSessions.length - 1];
		const incomingCall = makeIncomingCall({ callId: 'incoming-1', role: 'callee' });

		session.emit('newCall', { call: incomingCall });

		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(useCallStore.getState().call).toBeNull();
	});

	// ── CallView render contract ──────────────────────────────────────────────
	// Verifies useCallStore.setCall produces state that CallView renders.
	// Kept here because it proves the store → UI contract that the outgoing-call
	// path relies on (MediaSessionInstance calls setCall before navigating).

	it('setCall populates store and CallView renders; clearing store unmounts it', () => {
		const emitter = mockCallEmitter();
		const call = {
			callId: 'c-render',
			state: 'active',
			hidden: false,
			localParticipant: { local: true, role: 'caller', muted: false, held: false, contact: {} },
			remoteParticipants: [
				{
					local: false,
					role: 'callee',
					muted: false,
					held: false,
					contact: { displayName: 'Bob', username: 'bob', sipExtension: '' }
				}
			],
			reject: jest.fn(),
			hangup: jest.fn(),
			emitter: emitter as unknown as IClientMediaCall['emitter']
		} as unknown as IClientMediaCall;

		useCallStore.getState().setCall(call);

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
});
