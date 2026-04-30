/**
 * CallLifecycle.test.ts
 *
 * Tests for CallLifecycle.end(reason):
 *   - Teardown ordering verified via InMemoryVoipNative.recorded
 *   - Idempotency: concurrent end() calls → one observable teardown
 *   - callEnded emits exactly once per call
 *   - callId ?? nativeAcceptedCallId resolution (Pre-bind-safe)
 *   - reason payload threading
 */

jest.mock('react-native-callkeep', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(() => ({ remove: jest.fn() })),
		endCall: jest.fn(),
		clearInitialEvents: jest.fn(),
		getInitialEvents: jest.fn(() => Promise.resolve([]))
	}
}));
jest.mock('react-native-webrtc', () => ({ registerGlobals: jest.fn() }));
jest.mock('react-native-incall-manager', () => ({
	__esModule: true,
	default: { start: jest.fn(), stop: jest.fn(), setForceSpeakerphoneOn: jest.fn() }
}));
jest.mock('../../native/NativeVoip', () => ({
	__esModule: true,
	default: {
		registerVoipToken: jest.fn(),
		getInitialEvents: jest.fn(() => null),
		clearInitialEvents: jest.fn(),
		getLastVoipToken: jest.fn(() => ''),
		stopNativeDDPClient: jest.fn(),
		stopVoipCallService: jest.fn(),
		addListener: jest.fn(),
		removeListeners: jest.fn()
	}
}));
jest.mock('../../../containers/ActionSheet', () => ({
	hideActionSheetRef: jest.fn()
}));

import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { callLifecycle } from './CallLifecycle';
import type { CallEndReason } from './CallLifecycle';
import { InMemoryVoipNative } from './VoipNative';
import { useCallStore } from './useCallStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeNative(): InMemoryVoipNative {
	const native = new InMemoryVoipNative();
	callLifecycle.attach(native);
	return native;
}

function makeCall(options: { callId: string; state?: string }): IClientMediaCall {
	return {
		callId: options.callId,
		state: options.state ?? 'active',
		hidden: false,
		localParticipant: {
			local: true,
			role: 'caller',
			muted: false,
			held: false,
			contact: {}
		},
		remoteParticipants: [
			{
				local: false,
				role: 'callee',
				muted: false,
				held: false,
				contact: { id: 'u', displayName: 'U', username: 'u', sipExtension: '' }
			}
		],
		hangup: jest.fn(),
		reject: jest.fn(),
		sendDTMF: jest.fn(),
		emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
	} as unknown as IClientMediaCall;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CallLifecycle.end(reason)', () => {
	let native: InMemoryVoipNative;

	beforeEach(() => {
		// Reset store state before each test
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
		native = makeNative();
		native.reset();
	});

	afterEach(() => {
		// Clean up any listeners
	});

	describe('teardown ordering', () => {
		it('records native commands in the documented order: end → markActive → markAvailable → stopAudio', async () => {
			// Arrange: set up an active call in store
			const call = makeCall({ callId: 'order-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();

			// Act
			await callLifecycle.end('local');

			const recorded = native.recorded;
			const endIdx = recorded.findIndex(c => c.cmd === 'end');
			const markActiveIdx = recorded.findIndex(c => c.cmd === 'markActive');
			const markAvailableIdx = recorded.findIndex(c => c.cmd === 'markAvailable');
			const stopAudioIdx = recorded.findIndex(c => c.cmd === 'stopAudio');

			expect(endIdx).toBeGreaterThanOrEqual(0);
			expect(markActiveIdx).toBeGreaterThan(endIdx);
			expect(markAvailableIdx).toBeGreaterThan(markActiveIdx);
			expect(stopAudioIdx).toBeGreaterThan(markAvailableIdx);
		});

		it('issues end with callId', async () => {
			const call = makeCall({ callId: 'end-test-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();

			await callLifecycle.end('local');

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'end-test-1' });
		});

		it('issues markActive with empty string', async () => {
			const call = makeCall({ callId: 'mark-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			await callLifecycle.end('local');

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
		});

		it('issues markAvailable with callId', async () => {
			const call = makeCall({ callId: 'avail-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			await callLifecycle.end('local');

			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'avail-1' });
		});

		it('store is cleared (reset called)', async () => {
			const call = makeCall({ callId: 'store-1' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('local');

			expect(useCallStore.getState().call).toBeNull();
			expect(useCallStore.getState().callId).toBeNull();
		});

		it('stopAudio fires after store is cleared', async () => {
			const call = makeCall({ callId: 'stop-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			let storeStateAtStopAudio: unknown = 'not-captured';
			const origStopAudio = native.call.stopAudio.bind(native.call);
			jest.spyOn(native.call, 'stopAudio').mockImplementation(() => {
				storeStateAtStopAudio = useCallStore.getState().call;
				origStopAudio();
			});

			await callLifecycle.end('local');

			// Store should already be reset when stopAudio fires.
			expect(storeStateAtStopAudio).toBeNull();
		});

		it('calls hangup() on active call', async () => {
			const call = makeCall({ callId: 'hang-1', state: 'active' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('local');

			expect(call.hangup).toHaveBeenCalled();
			expect(call.reject).not.toHaveBeenCalled();
		});

		it('calls reject() on ringing call', async () => {
			const call = makeCall({ callId: 'ring-1', state: 'ringing' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('rejected');

			expect(call.reject).toHaveBeenCalled();
			expect(call.hangup).not.toHaveBeenCalled();
		});

		it('skips MediaCall hangup/reject when no active call in store', async () => {
			// No call set; should not throw and should still run native steps.
			native.reset();
			await callLifecycle.end('remote');

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
		});
	});

	describe('callEnded event', () => {
		it('emits callEnded exactly once', async () => {
			const call = makeCall({ callId: 'emit-1' });
			useCallStore.getState().setCall(call);

			const listener = jest.fn();
			callLifecycle.emitter.on('callEnded', listener);

			await callLifecycle.end('local');

			callLifecycle.emitter.off('callEnded', listener);
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('callEnded carries the callId from store', async () => {
			const call = makeCall({ callId: 'payload-1' });
			useCallStore.getState().setCall(call);

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));

			await callLifecycle.end('remote');

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ callId: 'payload-1', reason: 'remote' });
		});

		it('callEnded carries the reason', async () => {
			const reasons: CallEndReason[] = ['local', 'remote', 'rejected', 'error'];

			for (const reason of reasons) {
				useCallStore.getState().resetNativeCallId();
				useCallStore.getState().reset();
				native.reset();

				const events: unknown[] = [];
				const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
				await callLifecycle.end(reason);
				unsub();

				expect(events[0]).toMatchObject({ reason });
			}
		});
	});

	describe('callId ?? nativeAcceptedCallId (Pre-bind-safe)', () => {
		it('uses callId when both callId and nativeAcceptedCallId are present', async () => {
			const call = makeCall({ callId: 'cid-1' });
			useCallStore.getState().setNativeAcceptedCallId('native-1');
			useCallStore.getState().setCall(call);
			// After setCall, nativeAcceptedCallId is cleared; simulate pre-bind where both exist
			useCallStore.setState({ callId: 'cid-1', nativeAcceptedCallId: 'native-1' });
			native.reset();

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
			await callLifecycle.end('local');
			unsub();

			// callId takes precedence
			expect(events[0]).toMatchObject({ callId: 'cid-1' });
		});

		it('falls back to nativeAcceptedCallId when callId is null (Pre-bind)', async () => {
			// Pre-bind state: native accepted the call but no MediaCall yet
			useCallStore.getState().resetNativeCallId();
			useCallStore.getState().reset();
			useCallStore.getState().setNativeAcceptedCallId('native-prebind');
			native.reset();

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
			await callLifecycle.end('error');
			unsub();

			expect(events[0]).toMatchObject({ callId: 'native-prebind' });
			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'native-prebind' });
		});

		it('emits callId: null when both ids are null', async () => {
			useCallStore.getState().resetNativeCallId();
			useCallStore.getState().reset();
			native.reset();

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
			await callLifecycle.end('remote');
			unsub();

			expect(events[0]).toMatchObject({ callId: null });
		});
	});

	describe('idempotency under concurrent end()', () => {
		it('concurrent end() calls share the in-flight promise — one teardown', async () => {
			const call = makeCall({ callId: 'concurrent-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			// Fire two concurrent end() calls.
			const [p1, p2] = [callLifecycle.end('local'), callLifecycle.end('remote')];

			// Both callers receive a promise.
			expect(p1).toBeInstanceOf(Promise);
			expect(p2).toBeInstanceOf(Promise);

			// Both promises should be the same (in-flight sharing).
			expect(p1).toBe(p2);

			await Promise.all([p1, p2]);

			unsub();

			// callEnded fires exactly once (one teardown).
			expect(callEndedListener).toHaveBeenCalledTimes(1);

			// End command issues exactly once.
			const endCmds = native.recorded.filter(c => c.cmd === 'end');
			expect(endCmds).toHaveLength(1);
		});

		it('end() is callable again after first teardown completes', async () => {
			const call = makeCall({ callId: 'seq-1' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('local');

			// Second call (new lifecycle scenario): should not throw.
			await expect(callLifecycle.end('remote')).resolves.toBeUndefined();
		});
	});

	describe('native seam fallback', () => {
		it('end() uses module-level voipNative as default when no override is set', async () => {
			// The singleton voipNative is InMemoryVoipNative in test env (NODE_ENV=test).
			// Create a fresh lifecycle instance without calling attach().
			const freshLifecycle = new (callLifecycle.constructor as new () => typeof callLifecycle)();
			// Should resolve without throwing (uses module-level InMemoryVoipNative).
			await expect((freshLifecycle as any)._runTeardown('local')).resolves.toBeUndefined();
		});
	});

	describe('teardown clears private auto-hold flag', () => {
		it('_wasAutoHeld resets after end() so a JS-held next call does not auto-resume', async () => {
			// Why: callLifecycle is a module singleton and _wasAutoHeld persists between
			// distinct calls. If teardown leaves it set, a subsequent OS hold:false on
			// the next call would spuriously issue markActive (auto-resume path) even
			// though the next call was held by JS, never auto-held by the OS.
			const participantA = {
				local: true,
				role: 'caller' as const,
				muted: false,
				held: false,
				contact: {},
				setMuted: jest.fn(),
				setHeld: jest.fn()
			};
			const callA = makeCall({ callId: 'auto-held-a' });
			(callA as any).localParticipant = participantA;
			useCallStore.getState().setCall(callA);
			useCallStore.setState({ callId: 'auto-held-a' });

			// OS auto-holds the first call (sets _wasAutoHeld=true internally).
			callLifecycle.toggle('hold', 'native', 'auto-held-a', true);
			native.reset();

			// End the call — should reset _wasAutoHeld.
			await callLifecycle.end('remote');

			// Start a new call that is JS-held (e.g. user pressed hold from in-app UI).
			const participantB = {
				local: true,
				role: 'caller' as const,
				muted: false,
				held: true,
				contact: {},
				setMuted: jest.fn(),
				setHeld: jest.fn()
			};
			const callB = makeCall({ callId: 'auto-held-b' });
			(callB as any).localParticipant = participantB;
			useCallStore.getState().setCall(callB);
			useCallStore.setState({ callId: 'auto-held-b', isOnHold: true });
			native.reset();

			// OS-driven hold:false on the new call — since the previous call's
			// _wasAutoHeld must not bleed into this one, no markActive should fire.
			callLifecycle.toggle('hold', 'native', 'auto-held-b', false);

			expect(useCallStore.getState().isOnHold).toBe(false);
			expect(native.recorded).not.toContainEqual(expect.objectContaining({ cmd: 'markActive' }));
		});
	});
});

// ── toggle() ─────────────────────────────────────────────────────────────────

/**
 * Helpers shared across toggle describe blocks.
 */
function makeParticipant() {
	return {
		local: true,
		role: 'caller' as const,
		muted: false,
		held: false,
		contact: {},
		setMuted: jest.fn(),
		setHeld: jest.fn()
	};
}

function makeToggleCall(options: { callId: string; muted?: boolean; held?: boolean }) {
	const participant = makeParticipant();
	if (options.muted) participant.muted = true;
	if (options.held) participant.held = true;
	const call = makeCall({ callId: options.callId });
	// Override localParticipant with one that has setMuted/setHeld
	(call as any).localParticipant = participant;
	return { call, participant };
}

describe('CallLifecycle.toggle(kind, source)', () => {
	let native: InMemoryVoipNative;

	beforeEach(() => {
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
		native = makeNative();
		native.reset();
	});

	// ── mute / 'js' ──────────────────────────────────────────────────────────

	describe("toggle('mute', 'js')", () => {
		it('updates isMuted in store', () => {
			const { call } = makeToggleCall({ callId: 'mute-js-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-js-1' });
			native.reset();

			callLifecycle.toggle('mute', 'js');

			expect(useCallStore.getState().isMuted).toBe(true);
		});

		it('calls setMuted on localParticipant', () => {
			const { call, participant } = makeToggleCall({ callId: 'mute-js-2' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-js-2' });
			native.reset();

			callLifecycle.toggle('mute', 'js');

			expect(participant.setMuted).toHaveBeenCalledWith(true);
		});

		it('records ZERO voipNative commands (no RNCallKeep setMuted command — forward-compat scaffolding)', () => {
			const { call } = makeToggleCall({ callId: 'mute-js-3' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-js-3' });
			native.reset();

			callLifecycle.toggle('mute', 'js');

			expect(native.recorded).toHaveLength(0);
		});

		it('toggles from muted to unmuted', () => {
			const { call, participant } = makeToggleCall({ callId: 'mute-js-4', muted: true });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-js-4', isMuted: true });
			native.reset();

			callLifecycle.toggle('mute', 'js');

			expect(useCallStore.getState().isMuted).toBe(false);
			expect(participant.setMuted).toHaveBeenCalledWith(false);
		});

		it("defaults source to 'js' when not specified", () => {
			const { call } = makeToggleCall({ callId: 'mute-default-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-default-1' });
			native.reset();

			callLifecycle.toggle('mute');

			expect(useCallStore.getState().isMuted).toBe(true);
			expect(native.recorded).toHaveLength(0);
		});
	});

	// ── mute / 'native' — echo prevention ────────────────────────────────────

	describe("toggle('mute', 'native') — echo prevention", () => {
		it('updates isMuted in store', () => {
			const { call } = makeToggleCall({ callId: 'mute-native-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-native-1' });
			native.reset();

			callLifecycle.toggle('mute', 'native');

			expect(useCallStore.getState().isMuted).toBe(true);
		});

		it('calls setMuted on localParticipant', () => {
			const { call, participant } = makeToggleCall({ callId: 'mute-native-2' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-native-2' });
			native.reset();

			callLifecycle.toggle('mute', 'native');

			expect(participant.setMuted).toHaveBeenCalledWith(true);
		});

		it('records ZERO voipNative commands (echo prevention)', () => {
			const { call } = makeToggleCall({ callId: 'mute-native-3' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'mute-native-3' });
			native.reset();

			callLifecycle.toggle('mute', 'native');

			// Echo prevention: native source must never issue a voipNative command back.
			// (Contrast with speaker where 'js' records setSpeaker but 'native' must not.)
			expect(native.recorded).toHaveLength(0);
		});
	});

	// ── hold / 'js' ──────────────────────────────────────────────────────────

	describe("toggle('hold', 'js')", () => {
		it('updates isOnHold in store', () => {
			const { call } = makeToggleCall({ callId: 'hold-js-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-js-1' });
			native.reset();

			callLifecycle.toggle('hold', 'js');

			expect(useCallStore.getState().isOnHold).toBe(true);
		});

		it('calls setHeld on localParticipant', () => {
			const { call, participant } = makeToggleCall({ callId: 'hold-js-2' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-js-2' });
			native.reset();

			callLifecycle.toggle('hold', 'js');

			expect(participant.setHeld).toHaveBeenCalledWith(true);
		});

		it('records ZERO voipNative commands (no RNCallKeep setHeld command)', () => {
			const { call } = makeToggleCall({ callId: 'hold-js-3' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-js-3' });
			native.reset();

			callLifecycle.toggle('hold', 'js');

			expect(native.recorded).toHaveLength(0);
		});

		it('toggles from held to unheld', () => {
			const { call, participant } = makeToggleCall({ callId: 'hold-js-4', held: true });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-js-4', isOnHold: true });
			native.reset();

			callLifecycle.toggle('hold', 'js');

			expect(useCallStore.getState().isOnHold).toBe(false);
			expect(participant.setHeld).toHaveBeenCalledWith(false);
		});
	});

	// ── hold / 'native' — echo prevention + wasAutoHeld ──────────────────────

	describe("toggle('hold', 'native') — echo prevention + auto-resume", () => {
		it('records ZERO voipNative commands when going on hold (echo prevention)', () => {
			const { call } = makeToggleCall({ callId: 'hold-native-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-native-1' });
			native.reset();

			callLifecycle.toggle('hold', 'native');

			// No echo: the OS told us to hold, we must not echo back a hold command.
			expect(native.recorded).toHaveLength(0);
		});

		it('updates isOnHold in store when toggling to held', () => {
			const { call } = makeToggleCall({ callId: 'hold-native-2' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-native-2' });
			native.reset();

			callLifecycle.toggle('hold', 'native');

			expect(useCallStore.getState().isOnHold).toBe(true);
		});

		it('calls setHeld on localParticipant', () => {
			const { call, participant } = makeToggleCall({ callId: 'hold-native-3' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-native-3' });
			native.reset();

			callLifecycle.toggle('hold', 'native');

			expect(participant.setHeld).toHaveBeenCalledWith(true);
		});

		it('auto-resume: hold→false after auto-hold issues markActive (the documented per-kind exception)', () => {
			const { call } = makeToggleCall({ callId: 'hold-native-4' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-native-4' });
			native.reset();

			// OS places call on hold
			callLifecycle.toggle('hold', 'native'); // wasAutoHeld = true, isOnHold = true
			native.reset();

			// OS releases hold
			useCallStore.setState({ isOnHold: true }); // reflect current state
			callLifecycle.toggle('hold', 'native'); // should call markActive

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: 'hold-native-4' });
		});

		it('no markActive when hold→false without prior auto-hold (manual-resume path)', () => {
			const { call } = makeToggleCall({ callId: 'hold-native-5' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-native-5', isOnHold: true });
			native.reset();

			// No prior auto-hold — goes false directly
			callLifecycle.toggle('hold', 'native');

			expect(native.recorded).not.toContainEqual(expect.objectContaining({ cmd: 'markActive' }));
		});

		it('wasAutoHeld is private to CallLifecycle — not in useCallStore', () => {
			// wasAutoHeld must live as private state on CallLifecycle, not in the store.
			// Verify the store has no wasAutoHeld property.
			const storeState = useCallStore.getState();
			expect(storeState).not.toHaveProperty('wasAutoHeld');
		});

		// ── Idempotency: targetValue matching current state is a no-op ────────

		it('hold: redundant hold:true while already held is a no-op', () => {
			// Why: OS may send a second hold:true while the call is already held. Without
			// the targetValue idempotency check the toggle would flip to UNHELD and could
			// fire a spurious markActive.
			const { call, participant } = makeToggleCall({ callId: 'hold-native-redundant' });
			useCallStore.getState().setCall(call);
			// Simulate call already held (e.g. by a prior OS event or JS toggle).
			useCallStore.setState({ callId: 'hold-native-redundant', isOnHold: true });
			native.reset();

			// OS sends redundant hold:true — must be a complete no-op.
			callLifecycle.toggle('hold', 'native', 'hold-native-redundant', true);

			// Store unchanged.
			expect(useCallStore.getState().isOnHold).toBe(true);
			// No native commands (no markActive, no setSpeaker).
			expect(native.recorded).toHaveLength(0);
			// Participant setHeld was not called.
			expect(participant.setHeld).not.toHaveBeenCalled();
		});

		it('hold: hold:false after manual user-resume is a no-op', () => {
			// Why: OS may deliver a delayed hold:false AFTER the user already resumed
			// manually. Without idempotency the toggle would flip back to HELD and set
			// _wasAutoHeld=true, which would then trigger a spurious markActive next time.
			const { call, participant } = makeToggleCall({ callId: 'hold-native-late-resume' });
			useCallStore.getState().setCall(call);
			// Simulate call not on hold and _wasAutoHeld=false (user already resumed manually).
			useCallStore.setState({ callId: 'hold-native-late-resume', isOnHold: false });
			// Ensure _wasAutoHeld is false (no prior auto-hold that was not cleared).
			// We verify indirectly: a subsequent markActive should NOT fire.
			native.reset();

			// OS sends delayed hold:false — must be a complete no-op.
			callLifecycle.toggle('hold', 'native', 'hold-native-late-resume', false);

			// Store unchanged.
			expect(useCallStore.getState().isOnHold).toBe(false);
			// No native commands (no spurious markActive).
			expect(native.recorded).toHaveLength(0);
			// Participant setHeld was not called.
			expect(participant.setHeld).not.toHaveBeenCalled();
		});

		it('stale-UUID hold event clears _wasAutoHeld', () => {
			// A stale hold event (wrong UUID) must defensively clear _wasAutoHeld so that
			// a dead-call's auto-held flag cannot affect the next call's auto-resume path.
			const { call } = makeToggleCall({ callId: 'hold-native-stale' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-native-stale' });
			native.reset();

			// First: auto-hold the active call (sets _wasAutoHeld=true).
			callLifecycle.toggle('hold', 'native', 'hold-native-stale', true);
			expect(useCallStore.getState().isOnHold).toBe(true);
			native.reset();

			// Now: stale hold event from a different call UUID — must clear _wasAutoHeld.
			callLifecycle.toggle('hold', 'native', 'WRONG-UUID', true);

			// Verify _wasAutoHeld was cleared by asserting indirect behaviour:
			// a subsequent hold:false on the active call must NOT issue markActive
			// (because _wasAutoHeld was cleared by the stale-UUID drop above).
			callLifecycle.toggle('hold', 'native', 'hold-native-stale', false);

			// No markActive should have been recorded.
			expect(native.recorded).not.toContainEqual(expect.objectContaining({ cmd: 'markActive' }));
		});
	});

	// ── speaker / 'js' ───────────────────────────────────────────────────────

	describe("toggle('speaker', 'js')", () => {
		it('records setSpeaker(true) when speaker was off', async () => {
			const { call } = makeToggleCall({ callId: 'spk-js-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'spk-js-1', isSpeakerOn: false });
			native.reset();

			await callLifecycle.toggle('speaker', 'js');

			expect(native.recorded).toContainEqual({ cmd: 'setSpeaker', on: true });
		});

		it('records setSpeaker(false) when speaker was on', async () => {
			const { call } = makeToggleCall({ callId: 'spk-js-2' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'spk-js-2', isSpeakerOn: true });
			native.reset();

			await callLifecycle.toggle('speaker', 'js');

			expect(native.recorded).toContainEqual({ cmd: 'setSpeaker', on: false });
		});

		it('updates isSpeakerOn in store', async () => {
			const { call } = makeToggleCall({ callId: 'spk-js-3' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'spk-js-3', isSpeakerOn: false });
			native.reset();

			await callLifecycle.toggle('speaker', 'js');

			expect(useCallStore.getState().isSpeakerOn).toBe(true);
		});
	});

	describe("toggle('speaker', 'native') — reserved, records no commands", () => {
		it('records ZERO voipNative commands (out-of-scope for slice 07)', async () => {
			// Speaker 'native' source is reserved for future audio-route-sync work.
			// For now it must be a no-op so audio-route-sync still works via setState directly.
			const { call } = makeToggleCall({ callId: 'spk-native-1' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'spk-native-1', isSpeakerOn: false });
			native.reset();

			await callLifecycle.toggle('speaker', 'native');

			expect(native.recorded).toHaveLength(0);
		});

		it('directional assertion: js records setSpeaker, native does not', async () => {
			// This is the key directional test that makes the echo-prevention contract falsifiable.
			// For speaker, 'js' issues a command and 'native' must not — clear directionality.
			const { call: call1 } = makeToggleCall({ callId: 'spk-dir-1' });
			useCallStore.getState().setCall(call1);
			useCallStore.setState({ callId: 'spk-dir-1', isSpeakerOn: false });
			native.reset();
			await callLifecycle.toggle('speaker', 'js');
			const jsCommands = [...native.recorded];

			const { call: call2 } = makeToggleCall({ callId: 'spk-dir-2' });
			useCallStore.getState().setCall(call2);
			useCallStore.setState({ callId: 'spk-dir-2', isSpeakerOn: false });
			native.reset();
			await callLifecycle.toggle('speaker', 'native');
			const nativeCommands = [...native.recorded];

			expect(jsCommands).toContainEqual(expect.objectContaining({ cmd: 'setSpeaker' }));
			expect(nativeCommands).toHaveLength(0);
		});
	});

	// ── stale-UUID drop ───────────────────────────────────────────────────────

	describe('stale-UUID drop', () => {
		it('mute toggle is a no-op when callUuid does not match active callId or nativeAcceptedCallId', () => {
			const { call } = makeToggleCall({ callId: 'active-call-uuid' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'active-call-uuid', nativeAcceptedCallId: null });
			native.reset();

			// Provide a stale/mismatched UUID
			callLifecycle.toggle('mute', 'native', 'stale-uuid-xyz');

			// No store update, no participant call, no native command
			expect(useCallStore.getState().isMuted).toBe(false);
			expect(native.recorded).toHaveLength(0);
		});

		it('hold toggle is a no-op with mismatched UUID', () => {
			const { call } = makeToggleCall({ callId: 'hold-active-uuid' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'hold-active-uuid', nativeAcceptedCallId: null });
			native.reset();

			callLifecycle.toggle('hold', 'native', 'wrong-uuid');

			expect(useCallStore.getState().isOnHold).toBe(false);
			expect(native.recorded).toHaveLength(0);
		});

		it('matches callId case-insensitively', () => {
			const { call } = makeToggleCall({ callId: 'MIXED-CASE-UUID' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'MIXED-CASE-UUID', nativeAcceptedCallId: null });
			native.reset();

			// Lower-cased UUID should still match
			callLifecycle.toggle('mute', 'native', 'mixed-case-uuid');

			expect(useCallStore.getState().isMuted).toBe(true);
		});

		it('falls back to nativeAcceptedCallId when callId is null (Pre-bind)', () => {
			const { call } = makeToggleCall({ callId: 'prebind-uuid' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: null, nativeAcceptedCallId: 'prebind-uuid' });
			native.reset();

			callLifecycle.toggle('mute', 'native', 'prebind-uuid');

			expect(useCallStore.getState().isMuted).toBe(true);
		});

		it('is a no-op when no UUID is provided and no callId exists', () => {
			// No active call at all
			useCallStore.getState().resetNativeCallId();
			useCallStore.getState().reset();
			native.reset();

			// No UUID provided, no active call
			callLifecycle.toggle('mute', 'native', 'some-uuid');

			expect(useCallStore.getState().isMuted).toBe(false);
		});

		it('stale-UUID drop applies uniformly to all kinds — no isIOS branch', () => {
			// Mute, hold, speaker must all respect the UUID guard regardless of platform.
			const { call } = makeToggleCall({ callId: 'uniform-uuid' });
			useCallStore.getState().setCall(call);
			useCallStore.setState({ callId: 'uniform-uuid' });
			native.reset();

			callLifecycle.toggle('mute', 'native', 'wrong');
			callLifecycle.toggle('hold', 'native', 'wrong');

			expect(useCallStore.getState().isMuted).toBe(false);
			expect(useCallStore.getState().isOnHold).toBe(false);
		});
	});

	// ── no-op when no active call ─────────────────────────────────────────────

	describe('no-op without active call', () => {
		it('mute toggle without call is a no-op', () => {
			native.reset();
			callLifecycle.toggle('mute', 'js');
			expect(useCallStore.getState().isMuted).toBe(false);
			expect(native.recorded).toHaveLength(0);
		});

		it('hold toggle without call is a no-op', () => {
			native.reset();
			callLifecycle.toggle('hold', 'js');
			expect(useCallStore.getState().isOnHold).toBe(false);
			expect(native.recorded).toHaveLength(0);
		});

		it('speaker toggle without call is a no-op', async () => {
			native.reset();
			await callLifecycle.toggle('speaker', 'js');
			expect(useCallStore.getState().isSpeakerOn).toBe(false);
			expect(native.recorded).toHaveLength(0);
		});
	});
});
