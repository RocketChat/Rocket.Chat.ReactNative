// app/containers/NewMediaCall/NewMediaCall.integration.test.tsx
// Integration test: pressing the Call button in NewMediaCall triggers the
// media-signaling pipeline that opens CallView. Mocks @rocket.chat/media-signaling
// at the SDK boundary; does NOT mock mediaSessionInstance (that's the whole point).
//
// Seam: the real MediaSessionInstance runs. When the SDK fires `newCall`
// (simulated here by invoking the registered handler), we verify
//   - session.startCall was called with SDK-boundary args (actor, userId)
//   - Navigation.navigate('CallView') was called
//   - useCallStore.call was populated via the real setCall action
//   - emitter.on was wired at both SDK-layer (MediaSessionInstance) and store-layer (useCallStore)
// Test 5 separately proves CallView renders when useCallStore.getState().setCall(call) runs.

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
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
// Function-call form avoids both no-void and no-unused-expressions lint rules.
const assertType = <_T extends true>() => undefined;
assertType<InsideStackParamList extends { CallView: unknown } ? true : false>();

// ─── Mocks ────────────────────────────────────────────────────────────────────

// The jest moduleNameMapper covers app/lib/database only for the main repo root.
// Worktree paths (.claude/worktrees/quirky-euclid/app/lib/database) aren't matched,
// so we mock it per-file to prevent appGroup.ts from calling NativeModules.AppGroup at load.

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

// Required because useCallStore.ts imports it; the real hook calls AccessibilityInfo
// which is not globally mocked. useControlsVisible (used in CallButtons) reads it during render.
jest.mock('../../lib/hooks/useIsScreenReaderEnabled', () => ({
	useIsScreenReaderEnabled: jest.fn(() => false)
}));

// PeerList imports Avatar → database → appGroup (native NativeModule not available in Jest).
// FilterHeader and SelectedPeer may have similar chains. Mock them as null since they are
// not part of the integration contract (CreateCall button → MediaSessionInstance → CallView).
jest.mock('./PeerList', () => ({ PeerList: () => null }));
jest.mock('./FilterHeader', () => ({ FilterHeader: () => null }));
jest.mock('./SelectedPeer', () => ({ SelectedPeer: () => null }));

// usePeerAutocompleteStore imports getPeerAutocompleteOptions → restApi → encryption
// → @rocket.chat/mobile-crypto (ESM, not transformable in Jest). Mock the leaf dependency
// so the real store module loads and state actions work normally.
jest.mock('../../lib/services/voip/getPeerAutocompleteOptions', () => ({
	getPeerAutocompleteOptions: jest.fn().mockResolvedValue([])
}));

// CallView/CallButtons imports navigateToCallRoom → goRoom → restApi → encryption → ESM fail.
// Same mock used in CallView/index.test.tsx.
jest.mock('../../lib/services/voip/navigateToCallRoom', () => ({
	navigateToCallRoom: jest.fn().mockResolvedValue(undefined)
}));

const mockHideActionSheet = jest.fn();
// Minimal mock — only hideActionSheetRef (used by CreateCall and useCallStore.reset)
// and showActionSheetRef (used by CallButtons in CallView) are needed.
// Avoid jest.requireActual: the real ActionSheet loads deviceInfo at module init which
// calls DeviceInfo.hasNotch() — a native method not available in Jest.
jest.mock('../ActionSheet', () => ({
	hideActionSheetRef: () => mockHideActionSheet(),
	showActionSheetRef: jest.fn()
}));

// ─── Media-signaling mock ─────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNewCallHandler(): (payload: { call: IClientMediaCall }) => void {
	const session = createdSessions[createdSessions.length - 1];
	if (!session) {
		throw new Error('no session created');
	}
	const entry = session.on.mock.calls.find(([name]: [string]) => name === 'newCall');
	if (!entry) {
		throw new Error('newCall handler not registered');
	}
	return entry[1] as (payload: { call: IClientMediaCall }) => void;
}

function buildClientMediaCall(options: {
	callId: string;
	role: 'caller' | 'callee';
	hidden?: boolean;
	contact?: { username?: string; sipExtension?: string };
}): IClientMediaCall {
	const emitter = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
	return {
		callId: options.callId,
		hidden: options.hidden ?? false,
		state: 'ringing',
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
		reject: jest.fn(),
		emitter: emitter as unknown as IClientMediaCall['emitter']
	} as unknown as IClientMediaCall;
}

// For Test 5 — must satisfy IClientMediaCall shape so useCallStore.setCall can wire it.
function createMockCall(overrides: { callId?: string } = {}): IClientMediaCall {
	const emitter = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
	return {
		callId: overrides.callId ?? 'mock-call-id',
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
		// Clear calls made during setup (reset() calls hideActionSheetRef internally)
		mockHideActionSheet.mockClear();
	});

	afterEach(() => {
		consoleErrorSpy?.mockRestore();
		consoleErrorSpy = undefined;
		mediaSessionInstance.reset();
	});

	it('user peer: press Call → navigates to CallView, binds call, wires emitter at both layers', () => {
		setSelectedPeer({ type: 'user', value: 'user-1', label: 'Alice', username: 'alice' });
		const session = createdSessions[createdSessions.length - 1];

		const { getByTestId } = render(
			<Wrapper>
				<NewMediaCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));

		const outgoing = buildClientMediaCall({ callId: 'c1', role: 'caller' });
		getNewCallHandler()({ call: outgoing });

		// SDK-boundary contract: session.startCall(actor, userId) — note reversed vs public API
		expect(session.startCall).toHaveBeenCalledTimes(1);
		expect(session.startCall).toHaveBeenCalledWith('user', 'user-1');

		expect(Navigation.navigate).toHaveBeenCalledTimes(1);
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');

		// Real setCall action ran — store is populated with the actual call object
		expect(useCallStore.getState().call).toBe(outgoing);

		// Emitter wiring — two layers.
		// outgoing.emitter.on is jest.fn() at runtime; cast to access .mock.calls.
		const emitterOn = outgoing.emitter.on as unknown as jest.Mock;

		// 'stateChange': once from MediaSessionInstance.ts (SDK logging) + once from useCallStore.ts (store wiring)
		const stateChangeCalls = emitterOn.mock.calls.filter(([name]: [string]) => name === 'stateChange');
		expect(stateChangeCalls).toHaveLength(2);

		// 'trackStateChange': once from useCallStore.ts
		expect(emitterOn).toHaveBeenCalledWith('trackStateChange', expect.any(Function));

		// 'ended': once from MediaSessionInstance.ts (RNCallKeep cleanup) + once from useCallStore.ts (Navigation.back)
		const endedCalls = emitterOn.mock.calls.filter(([name]: [string]) => name === 'ended');
		expect(endedCalls).toHaveLength(2);
	});

	it('SIP peer: press Call → navigates to CallView and binds the call', () => {
		setSelectedPeer({ type: 'sip', value: '+5511999999999', label: '+55 11 99999-9999' });
		const session = createdSessions[createdSessions.length - 1];

		const { getByTestId } = render(
			<Wrapper>
				<NewMediaCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));

		const outgoing = buildClientMediaCall({ callId: 'c2', role: 'caller', contact: { sipExtension: 'ext' } });
		getNewCallHandler()({ call: outgoing });

		// SDK-boundary contract: session.startCall(actor, userId)
		expect(session.startCall).toHaveBeenCalledTimes(1);
		expect(session.startCall).toHaveBeenCalledWith('sip', '+5511999999999');

		expect(Navigation.navigate).toHaveBeenCalledTimes(1);
		expect(Navigation.navigate).toHaveBeenCalledWith('CallView');

		expect(useCallStore.getState().call?.callId).toBe('c2');
	});

	it('no peer selected: button disabled, no navigate, action sheet stays open', () => {
		// do not set a peer — store starts with selectedPeer: null
		const session = createdSessions[createdSessions.length - 1];

		const { getByTestId } = render(
			<Wrapper>
				<NewMediaCall />
			</Wrapper>
		);

		fireEvent.press(getByTestId('new-media-call-button'));
		// do NOT drive newCall

		expect(getByTestId('new-media-call-button').props.accessibilityState?.disabled).toBe(true);
		expect(session.startCall).not.toHaveBeenCalled();
		expect(Navigation.navigate).not.toHaveBeenCalled();
		expect(useCallStore.getState().call).toBeNull();
		// Only negative-path assertion: positive paths are covered by CreateCall.test.tsx
		expect(mockHideActionSheet).not.toHaveBeenCalled();
	});

	// Test 4 is a module-scope compile-time assertion (see _routeCheck above) — no it(...) block.
	// Renaming 'CallView' in InsideStack.tsx or MasterDetailStack/index.tsx will break tsc here.

	it('setCall(call) populates store and CallView renders its container', () => {
		const call = createMockCall({ callId: 'c5' });

		// Use the real action — exercises emitter subscriptions, InCallManager.start, contact extraction.
		// This proves the call-site (MediaSessionInstance calling setCall) produces state CallView renders,
		// not merely that an arbitrary state shape renders.
		useCallStore.getState().setCall(call);

		// Proves real setCall ran (not a setState bypass)
		expect(call.emitter.on).toHaveBeenCalledWith('stateChange', expect.any(Function));

		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<CallView />
			</Wrapper>
		);

		expect(getByTestId('call-view-container')).toBeTruthy();

		// Teardown — setState acceptable here because we're just clearing the UI
		act(() => {
			useCallStore.setState({ call: null });
		});
		expect(queryByTestId('call-view-container')).toBeNull();
	});
});
