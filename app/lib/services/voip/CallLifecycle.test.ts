/**
 * CallLifecycle.test.ts
 *
 * Tests for CallLifecycle.end(reason):
 *   - Teardown ordering verified via InMemoryVoipNative.recorded
 *   - Idempotency: concurrent end() calls → one observable teardown
 *   - callEnded emits exactly once per call
 *   - Pre-bind FSM (slice 08): preBindStatus(), native-answer → awaitingMediaCall → idle,
 *     cleanupAt elapse → failed('cleanup') → preBindFailed event → idle,
 *     pre-bind intent queue, lifecycle.end resets FSM
 *   - reason payload threading
 */

import type { IClientMediaCall } from '@rocket.chat/media-signaling';
import { act, renderHook } from '@testing-library/react-native';

import { callLifecycle } from './CallLifecycle';
import type { CallEndReason, PreBindStatus } from './CallLifecycle';
import { InMemoryVoipNative } from './VoipNative';
import { useCallStore } from './useCallStore';
import { useIsInActiveVoipCall } from './isInActiveVoipCall';

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
		useCallStore.getState().reset();
		native = makeNative();
		native.reset();
	});

	afterEach(() => {
		// Clean up any listeners
	});

	describe('teardown ordering', () => {
		it('records commands in the documented order (steps 2-4, 6)', async () => {
			// Arrange: set up an active call in store
			const call = makeCall({ callId: 'order-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();

			// Act
			await callLifecycle.end('local');

			// Assert: step 2 (end), step 3 (markActive ''), step 4 (markAvailable), step 6 (stopAudio)
			const { recorded } = native;
			const endIdx = recorded.findIndex(c => c.cmd === 'end');
			const markActiveIdx = recorded.findIndex(c => c.cmd === 'markActive');
			const markAvailableIdx = recorded.findIndex(c => c.cmd === 'markAvailable');
			const stopAudioIdx = recorded.findIndex(c => c.cmd === 'stopAudio');

			expect(endIdx).toBeGreaterThanOrEqual(0);
			expect(markActiveIdx).toBeGreaterThan(endIdx);
			expect(markAvailableIdx).toBeGreaterThan(markActiveIdx);
			expect(stopAudioIdx).toBeGreaterThan(markAvailableIdx);
		});

		it('step 2: issues end with callId', async () => {
			const call = makeCall({ callId: 'end-test-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();

			await callLifecycle.end('local');

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'end-test-1' });
		});

		it('step 3: issues markActive with empty string', async () => {
			const call = makeCall({ callId: 'mark-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			await callLifecycle.end('local');

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
		});

		it('step 4: issues markAvailable with callId', async () => {
			const call = makeCall({ callId: 'avail-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			await callLifecycle.end('local');

			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'avail-1' });
		});

		it('step 5: store is cleared (reset called)', async () => {
			const call = makeCall({ callId: 'store-1' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('local');

			expect(useCallStore.getState().call).toBeNull();
			expect(useCallStore.getState().callId).toBeNull();
		});

		it('step 6: stopAudio fires after store is cleared', async () => {
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

		it('step 1a: calls hangup() on active call', async () => {
			const call = makeCall({ callId: 'hang-1', state: 'active' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('local');

			expect(call.hangup).toHaveBeenCalled();
			expect(call.reject).not.toHaveBeenCalled();
		});

		it('step 1b: calls reject() on ringing call', async () => {
			const call = makeCall({ callId: 'ring-1', state: 'ringing' });
			useCallStore.getState().setCall(call);

			await callLifecycle.end('rejected');

			expect(call.reject).toHaveBeenCalled();
			expect(call.hangup).not.toHaveBeenCalled();
		});

		it('skips step 1 when no active call in store', async () => {
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

			const checkReason = async (reason: CallEndReason) => {
				useCallStore.getState().reset();
				native.reset();

				const events: unknown[] = [];
				const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
				await callLifecycle.end(reason);
				unsub();

				expect(events[0]).toMatchObject({ reason });
			};

			await reasons.reduce((chain, reason) => chain.then(() => checkReason(reason)), Promise.resolve());
		});
	});

	describe('callId resolution (Pre-bind FSM owns pre-bind UUID)', () => {
		it('uses callId from store when an active call is set', async () => {
			const call = makeCall({ callId: 'cid-1' });
			useCallStore.getState().setCall(call);
			native.reset();

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
			await callLifecycle.end('local');
			unsub();

			expect(events[0]).toMatchObject({ callId: 'cid-1' });
		});

		it('emits callId: null when no active call in store (Pre-bind FSM owns uuid)', async () => {
			// Pre-bind state is now owned by CallLifecycle.preBindStatus() — not the store.
			// callEnded uses store callId only; pre-bind uuid is surfaced via preBindStatus().
			useCallStore.getState().reset();
			native.reset();

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
			await callLifecycle.end('error');
			unsub();

			expect(events[0]).toMatchObject({ callId: null });
		});

		it('emits callId: null when both store callId and call are null', async () => {
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
});

// ── Pre-bind FSM (slice 08) ────────────────────────────────────────────────────

/**
 * makeMediaCall returns a minimal IClientMediaCall with a mutable localParticipant.
 * The `setMuted` / `setHeld` implementations mutate the participant state so replay
 * assertions can read `localParticipant.muted` / `localParticipant.held`.
 */
function makeMediaCall(options: { callId: string; state?: string }): IClientMediaCall {
	const localParticipant = {
		local: true as const,
		role: 'callee' as const,
		muted: false,
		held: false,
		contact: {},
		setMuted: jest.fn((v: boolean) => {
			localParticipant.muted = v;
		}),
		setHeld: jest.fn((v: boolean) => {
			localParticipant.held = v;
		})
	};
	return {
		callId: options.callId,
		state: options.state ?? 'active',
		hidden: false,
		localParticipant,
		remoteParticipants: [],
		hangup: jest.fn(),
		reject: jest.fn(),
		accept: jest.fn(),
		sendDTMF: jest.fn(),
		emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
	} as unknown as IClientMediaCall;
}

/**
 * Emit a minimal acceptSucceeded event to the native adapter.
 * VoipPayload has required fields not needed for FSM tests; cast via unknown.
 */
function emitAcceptSucceeded(n: InMemoryVoipNative, callId: string, host = 'h', fromColdStart = false): void {
	n.__emit({
		type: 'acceptSucceeded',
		payload: { callId, host, type: 'incoming_call' } as any,
		fromColdStart
	});
}

describe('CallLifecycle — Pre-bind FSM (slice 08)', () => {
	let native: InMemoryVoipNative;

	beforeEach(() => {
		jest.useFakeTimers();
		// Reset the singleton lifecycle's FSM and store between tests.
		(callLifecycle as any)._resetForTesting();
		useCallStore.getState().reset();
		native = new InMemoryVoipNative();
		callLifecycle.attach(native);
		native.reset();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	// ── 1. preBindStatus() starts idle ─────────────────────────────────────────

	describe('preBindStatus()', () => {
		it('returns idle when no native answer has been received', () => {
			const status: PreBindStatus = callLifecycle.preBindStatus();
			expect(status).toEqual({ kind: 'idle' });
		});
	});

	// ── 2. Native answer → awaitingMediaCall ──────────────────────────────────

	describe('idle → awaitingMediaCall on native answer', () => {
		it('transitions to awaitingMediaCall with correct uuid and host on acceptSucceeded', async () => {
			await native.attach({
				onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle)
			});
			emitAcceptSucceeded(native, 'call-1', 'my.host');

			const status = callLifecycle.preBindStatus();
			expect(status.kind).toBe('awaitingMediaCall');
			const awaitingStatus = status as Extract<PreBindStatus, { kind: 'awaitingMediaCall' }>;
			expect(awaitingStatus.uuid).toBe('call-1');
			expect(awaitingStatus.host).toBe('my.host');
			expect(awaitingStatus.cleanupAt).toBeGreaterThan(Date.now());
		});

		it('cleanupAt is set to now + 60_000 ms', async () => {
			const fixedNow = 1_000_000;
			jest.setSystemTime(fixedNow);
			await native.attach({
				onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle)
			});
			emitAcceptSucceeded(native, 'call-2');

			const status = callLifecycle.preBindStatus();
			expect(status.kind).toBe('awaitingMediaCall');
			const awaitingStatus = status as Extract<PreBindStatus, { kind: 'awaitingMediaCall' }>;
			expect(awaitingStatus.cleanupAt).toBe(fixedNow + 60_000);
		});
	});

	// ── 3. Matching newCall → bind → idle ─────────────────────────────────────

	describe('awaitingMediaCall → idle on matching MediaCall', () => {
		it('transitions FSM to idle when onMediaCallNew fires with matching callId', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'bind-1');

			const mediaCall = makeMediaCall({ callId: 'bind-1' });
			await callLifecycle.onMediaCallNew(mediaCall);

			expect(callLifecycle.preBindStatus()).toEqual({ kind: 'idle' });
		});

		it('does NOT transition when callId does not match awaiting uuid', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'bind-2');

			const wrongCall = makeMediaCall({ callId: 'wrong-id' });
			await callLifecycle.onMediaCallNew(wrongCall);

			expect(callLifecycle.preBindStatus().kind).toBe('awaitingMediaCall');
		});

		it('calls answerIncoming with the callId when binding', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'bind-3');

			const mediaCall = makeMediaCall({ callId: 'bind-3' });
			const answerSpy = jest.spyOn(callLifecycle, 'answerIncoming').mockResolvedValue(undefined);
			await callLifecycle.onMediaCallNew(mediaCall);

			expect(answerSpy).toHaveBeenCalledWith('bind-3');
			answerSpy.mockRestore();
		});
	});

	// ── 4. cleanupAt elapse → failed('cleanup') → idle ───────────────────────

	describe('awaitingMediaCall → failed(cleanup) → idle on cleanupAt elapse', () => {
		it('emits preBindFailed event with uuid and reason cleanup after 60s', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'cleanup-1');

			const failedEvents: unknown[] = [];
			const unsub = callLifecycle.emitter.on('preBindFailed', e => failedEvents.push(e));

			jest.advanceTimersByTime(60_000);
			// Allow any promises to settle
			await Promise.resolve();

			unsub();
			expect(failedEvents).toHaveLength(1);
			expect(failedEvents[0]).toMatchObject({ uuid: 'cleanup-1', reason: 'cleanup' });
		});

		it('FSM returns to idle after cleanupAt elapse', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'cleanup-2');

			jest.advanceTimersByTime(60_000);
			await Promise.resolve();

			expect(callLifecycle.preBindStatus()).toEqual({ kind: 'idle' });
		});

		it('calls lifecycle.end(cleanup) on cleanupAt elapse', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'cleanup-3');

			const endSpy = jest.spyOn(callLifecycle, 'end');

			jest.advanceTimersByTime(60_000);
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('cleanup');
			endSpy.mockRestore();
		});

		it('does NOT emit preBindFailed if MediaCall arrives before 60s', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'cleanup-4');

			// Bind arrives before cleanupAt
			await callLifecycle.onMediaCallNew(makeMediaCall({ callId: 'cleanup-4' }));

			const failedEvents: unknown[] = [];
			const unsub = callLifecycle.emitter.on('preBindFailed', e => failedEvents.push(e));
			jest.advanceTimersByTime(60_000);
			await Promise.resolve();
			unsub();

			expect(failedEvents).toHaveLength(0);
		});
	});

	// ── 5. Pre-bind intent queue ───────────────────────────────────────────────

	describe('pre-bind intent queue', () => {
		it('queues mute intent received during awaitingMediaCall and replays on bind', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'queue-1');

			// OS sends mute BEFORE MediaCall is bound
			native.__emit({ type: 'mute', muted: true, callUuid: 'queue-1' });

			const mediaCall = makeMediaCall({ callId: 'queue-1' });
			const answerSpy = jest.spyOn(callLifecycle, 'answerIncoming').mockResolvedValue(undefined);

			// Set the media call in store so flush can find it
			useCallStore.setState({ call: mediaCall, callId: 'queue-1' });
			await callLifecycle.onMediaCallNew(mediaCall);

			answerSpy.mockRestore();

			// After bind, mute should have been applied
			expect(mediaCall.localParticipant.setMuted).toHaveBeenCalledWith(true);
		});

		it('queues hold intent received during awaitingMediaCall and replays on bind', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'queue-2');

			native.__emit({ type: 'hold', hold: true, callUuid: 'queue-2' });

			const mediaCall = makeMediaCall({ callId: 'queue-2' });
			const answerSpy = jest.spyOn(callLifecycle, 'answerIncoming').mockResolvedValue(undefined);
			useCallStore.setState({ call: mediaCall, callId: 'queue-2' });
			await callLifecycle.onMediaCallNew(mediaCall);
			answerSpy.mockRestore();

			expect(mediaCall.localParticipant.setHeld).toHaveBeenCalledWith(true);
		});

		it('ignores intents for a different callUuid during awaitingMediaCall', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'queue-3');

			// mute event for a DIFFERENT callUuid — should not be queued
			native.__emit({ type: 'mute', muted: true, callUuid: 'OTHER' });

			const mediaCall = makeMediaCall({ callId: 'queue-3' });
			const answerSpy = jest.spyOn(callLifecycle, 'answerIncoming').mockResolvedValue(undefined);
			useCallStore.setState({ call: mediaCall, callId: 'queue-3' });
			await callLifecycle.onMediaCallNew(mediaCall);
			answerSpy.mockRestore();

			expect(mediaCall.localParticipant.setMuted).not.toHaveBeenCalled();
		});

		it('caps queued intents at 10 — drops oldest on overflow', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'queue-4');

			// Push 12 mute intents — cap is 10, oldest 2 are dropped
			for (let i = 0; i < 12; i++) {
				native.__emit({ type: 'mute', muted: i % 2 === 0, callUuid: 'queue-4' });
			}

			const mediaCall = makeMediaCall({ callId: 'queue-4' });
			const answerSpy = jest.spyOn(callLifecycle, 'answerIncoming').mockResolvedValue(undefined);
			useCallStore.setState({ call: mediaCall, callId: 'queue-4' });
			await callLifecycle.onMediaCallNew(mediaCall);
			answerSpy.mockRestore();

			// Only 10 intents replayed (cap of 10)
			expect(mediaCall.localParticipant.setMuted).toHaveBeenCalledTimes(10);
		});
	});

	// ── 6. lifecycle.end resets non-idle FSM ──────────────────────────────────

	describe('lifecycle.end resets non-idle FSM', () => {
		it('FSM returns to idle when lifecycle.end is called during awaitingMediaCall', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'end-fsm-1');

			expect(callLifecycle.preBindStatus().kind).toBe('awaitingMediaCall');
			await callLifecycle.end('local');

			expect(callLifecycle.preBindStatus()).toEqual({ kind: 'idle' });
		});
	});

	// ── 7. useCallStore no longer holds nativeAcceptedCallId ─────────────────

	describe('useCallStore cleanup', () => {
		it('does not expose nativeAcceptedCallId on store state', () => {
			const state = useCallStore.getState();
			expect('nativeAcceptedCallId' in state).toBe(false);
		});

		it('does not expose setNativeAcceptedCallId action', () => {
			const state = useCallStore.getState();
			expect('setNativeAcceptedCallId' in state).toBe(false);
		});

		it('does not expose resetNativeCallId action', () => {
			const state = useCallStore.getState();
			expect('resetNativeCallId' in state).toBe(false);
		});
	});

	// ── 8. preBindChanged event ───────────────────────────────────────────────

	describe('preBindChanged event', () => {
		it('emits preBindChanged with awaitingMediaCall on idle → awaitingMediaCall transition', async () => {
			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('preBindChanged', e => events.push(e));

			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'pbc-1', 'h');

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ status: { kind: 'awaitingMediaCall', uuid: 'pbc-1' } });
		});

		it('emits preBindChanged with idle on awaitingMediaCall → idle (matching newCall) transition', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'pbc-2');

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('preBindChanged', e => events.push(e));

			const mediaCall = makeMediaCall({ callId: 'pbc-2' });
			const answerSpy = jest.spyOn(callLifecycle, 'answerIncoming').mockResolvedValue(undefined);
			await callLifecycle.onMediaCallNew(mediaCall);
			answerSpy.mockRestore();

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ status: { kind: 'idle' } });
		});

		it('emits preBindChanged with failed then idle on cleanupAt elapse', async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			emitAcceptSucceeded(native, 'pbc-3');

			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('preBindChanged', e => events.push(e));

			jest.advanceTimersByTime(60_000);
			await Promise.resolve();

			unsub();
			// First: awaitingMediaCall → failed, Second: failed → idle
			expect(events.length).toBeGreaterThanOrEqual(2);
			expect(events[0]).toMatchObject({ status: { kind: 'failed', uuid: 'pbc-3', reason: 'cleanup' } });
			expect(events[events.length - 1]).toMatchObject({ status: { kind: 'idle' } });
		});

		it('does NOT emit preBindChanged when already idle and end() is called', async () => {
			// FSM is already idle; _transitionToIdle is a no-op emitter-wise.
			const events: unknown[] = [];
			const unsub = callLifecycle.emitter.on('preBindChanged', e => events.push(e));

			await callLifecycle.end('remote');

			unsub();
			expect(events).toHaveLength(0);
		});
	});

	// ── 9. Divergent-UUID native answer policy ───────────────────────────────

	describe('divergent-UUID native answer policy', () => {
		it('second acceptSucceeded with different UUID is silently dropped — FSM stays at first UUID', async () => {
			// Policy: first native answer wins. A second acceptSucceeded with a different UUID
			// is ignored while the FSM is in awaitingMediaCall. This prevents a spurious duplicate
			// from displacing a legitimate pending pre-bind window.
			// If the policy were "second wins", we would need to call lifecycle.end('error') for the
			// dropped UUID first — chosen not to do that here to avoid unintended teardown.
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });

			emitAcceptSucceeded(native, 'uuid-A', 'host-A');
			expect(callLifecycle.preBindStatus()).toMatchObject({ kind: 'awaitingMediaCall', uuid: 'uuid-A' });

			// Second native answer with a different UUID — should be silently dropped.
			emitAcceptSucceeded(native, 'uuid-B', 'host-B');

			// FSM stays at uuid-A; uuid-B is dropped.
			const status = callLifecycle.preBindStatus();
			expect(status.kind).toBe('awaitingMediaCall');
			const awaitingStatus = status as Extract<PreBindStatus, { kind: 'awaitingMediaCall' }>;
			expect(awaitingStatus.uuid).toBe('uuid-A');
		});
	});
});

// ── useIsInActiveVoipCall — reactive preBindChanged hook test ─────────────────

/**
 * Tests that useIsInActiveVoipCall reacts to preBindChanged events.
 * Uses the real callLifecycle singleton so the emitter path is exercised end-to-end.
 * useCallStore is also real — reset between tests.
 */
describe('useIsInActiveVoipCall — reactive preBindChanged subscription', () => {
	let native: InMemoryVoipNative;

	beforeEach(() => {
		jest.useFakeTimers();
		(callLifecycle as any)._resetForTesting();
		useCallStore.getState().reset();
		native = new InMemoryVoipNative();
		callLifecycle.attach(native);
		native.reset();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	it('returns true after awaitingMediaCall transition fires (preBindChanged entry edge)', async () => {
		const { result } = renderHook(() => useIsInActiveVoipCall());

		// Initially idle — no active call, no pre-bind.
		expect(result.current).toBe(false);

		// Emit native acceptSucceeded → callLifecycle.handleNativeEvent → FSM awaitingMediaCall
		// → preBindChanged emitted → useSyncExternalStore re-renders.
		await act(async () => {
			await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
			native.__emit({
				type: 'acceptSucceeded',
				payload: { callId: 'reactive-1', host: 'h', type: 'incoming_call' } as any,
				fromColdStart: false
			});
		});

		// Hook should now return true because FSM is in awaitingMediaCall.
		expect(callLifecycle.preBindStatus()).toMatchObject({ kind: 'awaitingMediaCall', uuid: 'reactive-1' });
		expect(result.current).toBe(true);
	});

	it('returns false after FSM returns to idle (preBindChanged exit edge)', async () => {
		await native.attach({ onEvent: callLifecycle.handleNativeEvent.bind(callLifecycle) });
		native.__emit({
			type: 'acceptSucceeded',
			payload: { callId: 'reactive-2', host: 'h', type: 'incoming_call' } as any,
			fromColdStart: false
		});

		const { result } = renderHook(() => useIsInActiveVoipCall());
		expect(result.current).toBe(true);

		// End the pre-bind via lifecycle.end — FSM returns to idle, preBindChanged emitted.
		await act(async () => {
			await callLifecycle.end('error');
		});

		expect(callLifecycle.preBindStatus()).toEqual({ kind: 'idle' });
		expect(result.current).toBe(false);
	});
});
