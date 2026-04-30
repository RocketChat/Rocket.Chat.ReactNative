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
import type { CallBeganEvent, CallEndReason } from './CallLifecycle';
import { InMemoryVoipNative } from './VoipNative';
import { useCallStore } from './useCallStore';
import { getDMSubscriptionByUsername } from '../../database/services/Subscription';

// Mock mediaSessionInstance — CallLifecycle.answerIncoming reads mediaCall via getMediaCall.
const mockGetMediaCall = jest.fn();
jest.mock('./MediaSessionInstance', () => ({
	mediaSessionInstance: {
		getMediaCall: (...args: unknown[]) => mockGetMediaCall(...args)
	}
}));

// Mock getDMSubscriptionByUsername — CallLifecycle.resolveRoomIdFromContact uses it.
jest.mock('../../database/services/Subscription', () => ({
	getDMSubscriptionByUsername: jest.fn()
}));

const mockGetDMSubscriptionByUsername = jest.mocked(getDMSubscriptionByUsername);

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

	// CodeRabbit follow-up: emit() must isolate per-listener throws so a single
	// failing subscriber neither aborts later listeners nor propagates up to
	// _runTeardown and rejects the _endPromise after teardown already finished.
	describe('callEnded listener throw isolation', () => {
		it('await end() resolves and remaining listeners still fire when an earlier listener throws', async () => {
			const call = makeCall({ callId: 'listener-throw-1', state: 'active' });
			useCallStore.getState().setCall(call);
			native.reset();

			const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

			const throwingListener = jest.fn(() => {
				throw new Error('listener boom');
			});
			const survivingListener = jest.fn();

			const unsub1 = callLifecycle.emitter.on('callEnded', throwingListener);
			const unsub2 = callLifecycle.emitter.on('callEnded', survivingListener);

			// 1. end() must resolve, not reject — teardown completed before emit.
			await expect(callLifecycle.end('local')).resolves.toBeUndefined();

			unsub1();
			unsub2();

			// 2. Both listeners ran; the throw did not abort the loop.
			expect(throwingListener).toHaveBeenCalledTimes(1);
			expect(survivingListener).toHaveBeenCalledTimes(1);
			expect(survivingListener).toHaveBeenCalledWith(expect.objectContaining({ callId: 'listener-throw-1', reason: 'local' }));

			// 3. The failure was logged via logger.warn → console.warn.
			expect(warnSpy).toHaveBeenCalled();
			const warnCalls = warnSpy.mock.calls.map(args => String(args[0] ?? ''));
			expect(warnCalls.some(msg => msg.includes('callEnded listener failed'))).toBe(true);

			warnSpy.mockRestore();
		});
	});
});

// ── CallLifecycle.answerIncoming ──────────────────────────────────────────────

describe('CallLifecycle.answerIncoming(callId)', () => {
	let native: InMemoryVoipNative;

	beforeEach(() => {
		jest.clearAllMocks();
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
		native = new InMemoryVoipNative();
		callLifecycle.attach(native);
		native.reset();
		mockGetDMSubscriptionByUsername.mockResolvedValue(null);
	});

	function makeIncomingCall(callId: string): IClientMediaCall {
		return {
			callId,
			state: 'ringing',
			hidden: false,
			localParticipant: { local: true, role: 'callee', muted: false, held: false, contact: {} },
			remoteParticipants: [
				{
					local: false,
					role: 'caller',
					muted: false,
					held: false,
					contact: { id: 'u', displayName: 'Caller', username: 'caller', sipExtension: '' }
				}
			],
			accept: jest.fn().mockResolvedValue(undefined),
			hangup: jest.fn(),
			reject: jest.fn(),
			sendDTMF: jest.fn(),
			emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
		} as unknown as IClientMediaCall;
	}

	describe('command ordering', () => {
		it('calls accept() then markActive() then startAudio() in order', async () => {
			const call = makeIncomingCall('inc-order-1');
			mockGetMediaCall.mockReturnValue(call);
			const order: string[] = [];
			(call.accept as jest.Mock).mockImplementation(() => {
				order.push('accept');
				return Promise.resolve();
			});
			jest.spyOn(native.call, 'markActive').mockImplementation(() => {
				order.push('markActive');
			});
			jest.spyOn(native.call, 'startAudio').mockImplementation(() => {
				order.push('startAudio');
			});

			await callLifecycle.answerIncoming('inc-order-1');

			expect(order).toEqual(['accept', 'markActive', 'startAudio']);
		});

		it('records markActive with callId', async () => {
			const call = makeIncomingCall('inc-mark-1');
			mockGetMediaCall.mockReturnValue(call);

			await callLifecycle.answerIncoming('inc-mark-1');

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: 'inc-mark-1' });
		});

		it('records startAudio', async () => {
			const call = makeIncomingCall('inc-audio-1');
			mockGetMediaCall.mockReturnValue(call);

			await callLifecycle.answerIncoming('inc-audio-1');

			expect(native.recorded).toContainEqual({ cmd: 'startAudio' });
		});

		it('does NOT record markActive or startAudio when call is not found', async () => {
			mockGetMediaCall.mockReturnValue(null);
			native.reset();

			await callLifecycle.answerIncoming('not-found');

			expect(native.recorded).not.toContainEqual(expect.objectContaining({ cmd: 'markActive' }));
			expect(native.recorded).not.toContainEqual(expect.objectContaining({ cmd: 'startAudio' }));
		});
	});

	describe('store updates', () => {
		it('sets call and direction incoming in store', async () => {
			const call = makeIncomingCall('inc-store-1');
			mockGetMediaCall.mockReturnValue(call);

			await callLifecycle.answerIncoming('inc-store-1');

			expect(useCallStore.getState().call).toBe(call);
			expect(useCallStore.getState().direction).toBe('incoming');
		});
	});

	describe('callBegan event', () => {
		it('emits callBegan exactly once with direction incoming', async () => {
			const call = makeIncomingCall('inc-began-1');
			mockGetMediaCall.mockReturnValue(call);

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.answerIncoming('inc-began-1');

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ callId: 'inc-began-1', direction: 'incoming' });
		});

		it('callBegan includes roomId when resolved from contact', async () => {
			const call = makeIncomingCall('inc-room-1');
			mockGetMediaCall.mockReturnValue(call);
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'dm-rid-incoming' } as any);

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.answerIncoming('inc-room-1');

			unsub();
			expect(events[0]).toMatchObject({ callId: 'inc-room-1', direction: 'incoming', roomId: 'dm-rid-incoming' });
		});

		it('callBegan roomId is undefined when contact has no username', async () => {
			const call = makeIncomingCall('inc-noroom-1');
			// Override contact with no username
			(call as any).remoteParticipants = [{ contact: {} }];
			mockGetMediaCall.mockReturnValue(call);

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.answerIncoming('inc-noroom-1');

			unsub();
			expect(events[0].roomId).toBeUndefined();
		});

		it('does NOT emit callBegan when call is not found', async () => {
			mockGetMediaCall.mockReturnValue(null);

			const listener = jest.fn();
			const unsub = callLifecycle.emitter.on('callBegan', listener);

			await callLifecycle.answerIncoming('not-found-2');

			unsub();
			expect(listener).not.toHaveBeenCalled();
		});

		it('still emits callBegan when DM lookup rejects (audio active → CallView must navigate)', async () => {
			const call = makeIncomingCall('inc-dbfail-1');
			mockGetMediaCall.mockReturnValue(call);
			mockGetDMSubscriptionByUsername.mockRejectedValue(new Error('db boom'));

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await expect(callLifecycle.answerIncoming('inc-dbfail-1')).resolves.toBeUndefined();

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ callId: 'inc-dbfail-1', direction: 'incoming' });
			expect(events[0].roomId).toBeUndefined();
		});
	});

	describe('idempotency', () => {
		it('returns early (no double-accept) when store already has a call with same callId', async () => {
			const call = makeIncomingCall('inc-idempotent-1');
			mockGetMediaCall.mockReturnValue(call);

			// First call — sets call in store
			await callLifecycle.answerIncoming('inc-idempotent-1');

			native.reset();
			const listener = jest.fn();
			const unsub = callLifecycle.emitter.on('callBegan', listener);

			// Second call with same callId — should be a no-op
			await callLifecycle.answerIncoming('inc-idempotent-1');

			unsub();
			expect(call.accept).toHaveBeenCalledTimes(1);
			expect(native.recorded).toHaveLength(0);
			expect(listener).not.toHaveBeenCalled();
		});

		it('concurrent answerIncoming for the same callId — accept called exactly once, one callBegan', async () => {
			const call = makeIncomingCall('inc-concurrent-1');
			mockGetMediaCall.mockReturnValue(call);

			const beganEvents: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => beganEvents.push(e));

			// Fire two concurrent answerIncoming calls before either resolves.
			const [p1, p2] = [callLifecycle.answerIncoming('inc-concurrent-1'), callLifecycle.answerIncoming('inc-concurrent-1')];

			// Both callers should receive the same in-flight Promise.
			expect(p1).toBe(p2);

			await Promise.all([p1, p2]);

			unsub();

			// accept() must be called exactly once — no WebRTC double offer-answer.
			expect(call.accept).toHaveBeenCalledTimes(1);

			// markActive and startAudio each appear exactly once.
			const markActiveCmds = native.recorded.filter(c => c.cmd === 'markActive' && c.callUuid === 'inc-concurrent-1');
			const startAudioCmds = native.recorded.filter(c => c.cmd === 'startAudio');
			expect(markActiveCmds).toHaveLength(1);
			expect(startAudioCmds).toHaveLength(1);

			// callBegan emits exactly once — no duplicate CallView push.
			expect(beganEvents).toHaveLength(1);
			expect(beganEvents[0]).toMatchObject({ callId: 'inc-concurrent-1', direction: 'incoming' });
		});

		it('proceeds normally for a different callId after a prior answer', async () => {
			const callA = makeIncomingCall('inc-idem-a');
			mockGetMediaCall.mockReturnValue(callA);
			await callLifecycle.answerIncoming('inc-idem-a');

			// Reset store for a "new" call scenario
			useCallStore.getState().reset();
			const callB = makeIncomingCall('inc-idem-b');
			mockGetMediaCall.mockReturnValue(callB);
			native.reset();

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));
			await callLifecycle.answerIncoming('inc-idem-b');
			unsub();

			expect(callB.accept).toHaveBeenCalledTimes(1);
			expect(events).toHaveLength(1);
			expect(events[0].callId).toBe('inc-idem-b');
		});
	});

	describe('pre-bind compatibility', () => {
		it('does not remove tryAnswerIfNativeAcceptedNotification path — nativeAcceptedCallId still survives reset()', () => {
			// Verify store still exposes nativeAcceptedCallId (Pre-bind path in slice 08 depends on it)
			useCallStore.getState().setNativeAcceptedCallId('prebind-id');
			useCallStore.getState().reset();
			expect(useCallStore.getState().nativeAcceptedCallId).toBe('prebind-id');
		});
	});
});

// ── CallLifecycle.beginOutgoing ───────────────────────────────────────────────

describe('CallLifecycle.beginOutgoing(call, room?)', () => {
	let native: InMemoryVoipNative;

	beforeEach(() => {
		jest.clearAllMocks();
		useCallStore.getState().resetNativeCallId();
		useCallStore.getState().reset();
		native = new InMemoryVoipNative();
		callLifecycle.attach(native);
		native.reset();
		mockGetDMSubscriptionByUsername.mockResolvedValue(null);
	});

	function makeOutgoingCall(callId: string): IClientMediaCall {
		return {
			callId,
			state: 'active',
			hidden: false,
			localParticipant: { local: true, role: 'caller', muted: false, held: false, contact: {} },
			remoteParticipants: [
				{
					local: false,
					role: 'callee',
					muted: false,
					held: false,
					contact: { id: 'u', displayName: 'Callee', username: 'callee', sipExtension: '' }
				}
			],
			hangup: jest.fn(),
			reject: jest.fn(),
			sendDTMF: jest.fn(),
			emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
		} as unknown as IClientMediaCall;
	}

	describe('command ordering', () => {
		it('records markActive then startAudio in order', async () => {
			const call = makeOutgoingCall('out-order-1');
			const order: string[] = [];
			jest.spyOn(native.call, 'markActive').mockImplementation(() => {
				order.push('markActive');
			});
			jest.spyOn(native.call, 'startAudio').mockImplementation(() => {
				order.push('startAudio');
			});

			await callLifecycle.beginOutgoing(call);

			expect(order).toEqual(['markActive', 'startAudio']);
		});

		it('records markActive with callId', async () => {
			const call = makeOutgoingCall('out-mark-1');

			await callLifecycle.beginOutgoing(call);

			expect(native.recorded).toContainEqual({ cmd: 'markActive', callUuid: 'out-mark-1' });
		});

		it('records startAudio', async () => {
			const call = makeOutgoingCall('out-audio-1');

			await callLifecycle.beginOutgoing(call);

			expect(native.recorded).toContainEqual({ cmd: 'startAudio' });
		});
	});

	describe('store updates', () => {
		it('sets call and direction outgoing in store', async () => {
			const call = makeOutgoingCall('out-store-1');

			await callLifecycle.beginOutgoing(call);

			expect(useCallStore.getState().call).toBe(call);
			expect(useCallStore.getState().direction).toBe('outgoing');
		});

		it('sets roomId from room argument when provided', async () => {
			const call = makeOutgoingCall('out-room-1');
			const room = { rid: 'room-rid-out' } as any;

			await callLifecycle.beginOutgoing(call, room);

			expect(useCallStore.getState().roomId).toBe('room-rid-out');
		});

		it('sets roomId to null when no room argument', async () => {
			const call = makeOutgoingCall('out-noroom-1');

			await callLifecycle.beginOutgoing(call);

			// setRoomId(undefined) should result in null/undefined — doesn't set a non-null value
			// The store's roomId was null to begin with; verify no roomId is set from an unknown source
			expect(useCallStore.getState().roomId).toBeFalsy();
		});

		it('falls back to DM subscription lookup by contact username when no room argument (DM-by-username regression)', async () => {
			// Pre-refactor parity: outgoing DM initiated by username (CreateCall path)
			// has roomId == null in the store. The newCall handler used to resolve the
			// DM rid from the remote participant's username via getDMSubscriptionByUsername.
			// CallLifecycle.beginOutgoing must keep that fallback alive — otherwise the
			// "Go to chat" button on CallView stays disabled.
			const call = makeOutgoingCall('out-fallback-1');
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'dm-rid-from-contact' } as any);

			await callLifecycle.beginOutgoing(call);

			expect(mockGetDMSubscriptionByUsername).toHaveBeenCalledWith('callee');
			expect(useCallStore.getState().roomId).toBe('dm-rid-from-contact');
		});

		it('does NOT fall back to contact lookup when room argument is provided', async () => {
			// Caller-supplied roomId (e.g. startCallByRoom path) wins — no DB hit needed.
			const call = makeOutgoingCall('out-room-wins-1');
			const room = { rid: 'explicit-room' } as any;

			await callLifecycle.beginOutgoing(call, room);

			expect(mockGetDMSubscriptionByUsername).not.toHaveBeenCalled();
			expect(useCallStore.getState().roomId).toBe('explicit-room');
		});

		it('callBegan includes roomId resolved from contact when no room argument', async () => {
			const call = makeOutgoingCall('out-fallback-began-1');
			mockGetDMSubscriptionByUsername.mockResolvedValue({ rid: 'dm-rid-began' } as any);

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.beginOutgoing(call);

			unsub();
			expect(events[0]).toMatchObject({
				callId: 'out-fallback-began-1',
				direction: 'outgoing',
				roomId: 'dm-rid-began'
			});
		});

		it('keeps roomId falsy when contact has no username (no DM lookup possible)', async () => {
			const call = makeOutgoingCall('out-noun-1');
			(call as any).remoteParticipants = [{ contact: {} }];

			await callLifecycle.beginOutgoing(call);

			expect(mockGetDMSubscriptionByUsername).not.toHaveBeenCalled();
			expect(useCallStore.getState().roomId).toBeFalsy();
		});
	});

	describe('callBegan event', () => {
		it('emits callBegan exactly once with direction outgoing', async () => {
			const call = makeOutgoingCall('out-began-1');

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.beginOutgoing(call);

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ callId: 'out-began-1', direction: 'outgoing' });
		});

		it('callBegan includes roomId from room argument', async () => {
			const call = makeOutgoingCall('out-room-began-1');
			const room = { rid: 'outgoing-room' } as any;

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.beginOutgoing(call, room);

			unsub();
			expect(events[0]).toMatchObject({ callId: 'out-room-began-1', direction: 'outgoing', roomId: 'outgoing-room' });
		});

		it('callBegan emits once regardless of room argument', async () => {
			const call = makeOutgoingCall('out-once-1');

			const listener = jest.fn();
			const unsub = callLifecycle.emitter.on('callBegan', listener);

			await callLifecycle.beginOutgoing(call);

			unsub();
			expect(listener).toHaveBeenCalledTimes(1);
		});

		it('still emits callBegan when DM lookup rejects (audio active → CallView must navigate)', async () => {
			const call = makeOutgoingCall('out-dbfail-1');
			mockGetDMSubscriptionByUsername.mockRejectedValue(new Error('db boom'));

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await expect(callLifecycle.beginOutgoing(call)).resolves.toBeUndefined();

			unsub();
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({ callId: 'out-dbfail-1', direction: 'outgoing' });
			expect(events[0].roomId).toBeUndefined();
		});
	});

	describe('callBegan emitted exactly once between both transitions', () => {
		it('answerIncoming + beginOutgoing each emit callBegan independently once', async () => {
			const incoming = {
				callId: 'both-inc-1',
				state: 'ringing',
				hidden: false,
				localParticipant: { local: true, role: 'callee', muted: false, held: false, contact: {} },
				remoteParticipants: [{ local: false, role: 'caller', muted: false, held: false, contact: { username: 'caller' } }],
				accept: jest.fn().mockResolvedValue(undefined),
				hangup: jest.fn(),
				reject: jest.fn(),
				sendDTMF: jest.fn(),
				emitter: { on: jest.fn(), off: jest.fn(), emit: jest.fn() }
			} as unknown as IClientMediaCall;
			mockGetMediaCall.mockReturnValue(incoming);
			const outgoing = makeOutgoingCall('both-out-1');

			const events: CallBeganEvent[] = [];
			const unsub = callLifecycle.emitter.on('callBegan', e => events.push(e));

			await callLifecycle.answerIncoming('both-inc-1');
			// Reset store to simulate a fresh call scenario
			useCallStore.getState().reset();
			await callLifecycle.beginOutgoing(outgoing);

			unsub();
			expect(events).toHaveLength(2);
			expect(events[0]).toMatchObject({ callId: 'both-inc-1', direction: 'incoming' });
			expect(events[1]).toMatchObject({ callId: 'both-out-1', direction: 'outgoing' });
		});
	});
});
