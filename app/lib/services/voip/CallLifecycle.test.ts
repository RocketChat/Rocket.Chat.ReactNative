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

import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import { callLifecycle } from './CallLifecycle';
import type { CallEndReason } from './CallLifecycle';
import { InMemoryVoipNative } from './VoipNative';
import { useCallStore } from './useCallStore';

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
		useCallStore.getState().resetNativeCallId();
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

			for (const reason of reasons) {
				useCallStore.getState().resetNativeCallId();
				useCallStore.getState().reset();
				native.reset();

				const events: unknown[] = [];
				const unsub = callLifecycle.emitter.on('callEnded', e => events.push(e));
				// eslint-disable-next-line no-await-in-loop
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

	// Blocker 1 regression: faithful spy whose hangup() synchronously emits 'ended'
	// (mirrors @rocket.chat/media-signaling/dist/lib/Call.js behavior at line 703).
	// The 'ended' listener at useCallStore.ts handleEnded re-enters callLifecycle.end('remote').
	// The re-entry guard MUST be set BEFORE _runTeardown body runs, otherwise re-entrant
	// teardown happens (callEnded fires twice, end command issues twice).
	describe('re-entry guard against synchronous ended emission from hangup()', () => {
		function makeCallWithSyncEndedOnHangup(callId: string): IClientMediaCall {
			const listeners: Record<string, Set<(...args: unknown[]) => void>> = {};
			const emitter = {
				on: (ev: string, fn: (...args: unknown[]) => void) => {
					if (!listeners[ev]) listeners[ev] = new Set();
					listeners[ev].add(fn);
					return () => listeners[ev].delete(fn);
				},
				off: (ev: string, fn: (...args: unknown[]) => void) => {
					listeners[ev]?.delete(fn);
				},
				emit: (ev: string, ...args: unknown[]) => {
					listeners[ev]?.forEach(fn => fn(...args));
				}
			};
			const hangup = jest.fn(() => {
				// Mirror Call.js line 703: changeState('hangup') → emitter.emit('ended')
				emitter.emit('ended');
			});
			return {
				callId,
				state: 'active',
				hidden: false,
				localParticipant: {
					local: true,
					role: 'caller',
					muted: false,
					held: false,
					contact: {},
					setMuted: jest.fn(),
					setHeld: jest.fn()
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
				hangup,
				reject: jest.fn(),
				sendDTMF: jest.fn(),
				emitter
			} as unknown as IClientMediaCall;
		}

		it('end() called from inside hangup() synchronous ended emit hits the re-entry guard', async () => {
			const call = makeCallWithSyncEndedOnHangup('reentry-1');
			useCallStore.getState().setCall(call);
			native.reset();

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			// Outer end('local') triggers hangup() → 'ended' → handleEnded → end('remote')
			// Re-entrant call MUST hit the guard and return the in-flight promise.
			await callLifecycle.end('local');

			unsub();

			// callEnded fires exactly once — guard worked.
			expect(callEndedListener).toHaveBeenCalledTimes(1);
			// End command issued exactly once.
			const endCmds = native.recorded.filter(c => c.cmd === 'end');
			expect(endCmds).toHaveLength(1);
			// hangup invoked exactly once.
			expect(call.hangup).toHaveBeenCalledTimes(1);
		});
	});

	// Blocker 3 regression: step 1 (mediaCall.reject/hangup) is wrapped in try/catch
	// so a throw doesn't abort subsequent steps (markActive, markAvailable, store reset, stopAudio, callEnded).
	describe('step 1 throw isolation', () => {
		it('continues teardown when mediaCall.hangup() throws', async () => {
			const call = makeCall({ callId: 'throw-1', state: 'active' });
			(call.hangup as jest.Mock).mockImplementationOnce(() => {
				throw new Error('hangup boom');
			});
			useCallStore.getState().setCall(call);
			native.reset();

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub();

			// All subsequent steps still ran.
			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'throw-1' });
			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'throw-1' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
			expect(useCallStore.getState().call).toBeNull();
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});

		it('continues teardown when mediaCall.reject() throws (ringing path)', async () => {
			const call = makeCall({ callId: 'throw-rej-1', state: 'ringing' });
			(call.reject as jest.Mock).mockImplementationOnce(() => {
				throw new Error('reject boom');
			});
			useCallStore.getState().setCall(call);
			native.reset();

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('rejected')).resolves.toBeUndefined();

			unsub();

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'throw-rej-1' });
			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'throw-rej-1' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
			expect(useCallStore.getState().call).toBeNull();
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});
	});

	// CodeRabbit follow-up: steps 2-6 must also be guarded so a throw in any of
	// them does not abort the rest of teardown or skip the callEnded emit.
	describe('steps 2-6 throw isolation', () => {
		it('continues teardown when native.call.end throws', async () => {
			const call = makeCall({ callId: 'throw-end-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();
			jest.spyOn(native.call, 'end').mockImplementationOnce(() => {
				throw new Error('end boom');
			});

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub();

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'throw-end-1' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
			expect(useCallStore.getState().call).toBeNull();
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});

		it('continues teardown when native.call.markActive throws', async () => {
			const call = makeCall({ callId: 'throw-ma-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();
			jest.spyOn(native.call, 'markActive').mockImplementationOnce(() => {
				throw new Error('markActive boom');
			});

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub();

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'throw-ma-1' });
			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'throw-ma-1' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
			expect(useCallStore.getState().call).toBeNull();
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});

		it('continues teardown when native.call.markAvailable throws', async () => {
			const call = makeCall({ callId: 'throw-mv-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();
			jest.spyOn(native.call, 'markAvailable').mockImplementationOnce(() => {
				throw new Error('markAvailable boom');
			});

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub();

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'throw-mv-1' });
			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
			expect(useCallStore.getState().call).toBeNull();
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});

		it('continues teardown when useCallStore.reset throws', async () => {
			const call = makeCall({ callId: 'throw-reset-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();
			const resetSpy = jest.spyOn(useCallStore.getState(), 'reset').mockImplementationOnce(() => {
				throw new Error('reset boom');
			});

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub();
			resetSpy.mockRestore();

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'throw-reset-1' });
			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'throw-reset-1' });
			expect(native.recorded).toContainEqual({ cmd: 'stopAudio' });
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});

		it('continues teardown when native.call.stopAudio throws', async () => {
			const call = makeCall({ callId: 'throw-stop-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();
			jest.spyOn(native.call, 'stopAudio').mockImplementationOnce(() => {
				throw new Error('stopAudio boom');
			});

			const callEndedListener = jest.fn();
			const unsub = callLifecycle.emitter.on('callEnded', callEndedListener);

			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub();

			expect(native.recorded).toContainEqual({ cmd: 'end', callUuid: 'throw-stop-1' });
			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: '' });
			expect(native.recorded).toContainEqual({ cmd: 'markAvailable', callUuid: 'throw-stop-1' });
			expect(useCallStore.getState().call).toBeNull();
			// callEnded MUST still emit even though stopAudio threw.
			expect(callEndedListener).toHaveBeenCalledTimes(1);
		});
	});
});
