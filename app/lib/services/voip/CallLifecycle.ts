/**
 * CallLifecycle — orchestrates the end-of-call teardown sequence and the
 * Pre-bind FSM (slice 08).
 *
 * Teardown order (documented here and verified in tests):
 *   1. mediaCall.reject() if state === 'ringing', else mediaCall.hangup()
 *   2. voipNative.call.end(callUuid)
 *   3. voipNative.call.markActive('')
 *   4. voipNative.call.markAvailable(callUuid)
 *   5. useCallStore.reset()        ← clears JS state; stopAudio removed from here (step 6 owns it)
 *   6. voipNative.call.stopAudio() ← fires after store reset so subscribers see consistent state
 *   7. emit callEnded { callId, reason }
 *
 * Idempotency: concurrent callers receive the in-flight Promise (no double teardown).
 *
 * Pre-bind FSM (private):
 *   idle
 *     → awaitingMediaCall { uuid, host, cleanupAt, queuedIntents }
 *         on native acceptSucceeded / answer (via handleNativeEvent)
 *     → idle on matching onMediaCallNew(callId === uuid) — binds via answerIncoming()
 *     → failed { uuid, reason: 'cleanup' } on cleanupAt elapse
 *         → emits preBindFailed { uuid, reason }
 *         → calls lifecycle.end('cleanup')
 *         → idle
 *   Any non-idle state → idle on lifecycle.end() or store.reset()
 *
 * NOTE: `failed.replayMismatch` is defined in the type union but not produced in this
 * slice — it is reserved for slice 09 (cold-start replay). Do not remove it.
 */

import type { IClientMediaCall } from '@rocket.chat/media-signaling';

import type { VoipPayload } from '../../../definitions/Voip';
import { voipNative, type VoipNativePort, type VoipNativeEvent } from './VoipNative';
import { useCallStore } from './useCallStore';

// ── Pre-bind FSM types ────────────────────────────────────────────────────────

/** Maximum number of pre-bind intents to queue; oldest are dropped on overflow. */
const PRE_BIND_INTENT_CAP = 10;

/** Duration before a pending native accept is garbage-collected (reframed as GC, not a timeout). */
const CLEANUP_AT_OFFSET_MS = 60_000;

type PreBindIntent = { kind: 'mute'; muted: boolean } | { kind: 'hold'; hold: boolean };

/**
 * Public FSM snapshot returned by preBindStatus().
 * - idle: no pending native accept
 * - awaitingMediaCall: native accepted; waiting for MediaSignalingSession.newCall
 * - failed: cleanupAt elapsed without a matching newCall (or replayMismatch from slice 09)
 *
 * `failed` is transient — observable only via the `preBindFailed` event, not via polling
 * preBindStatus(). The FSM collapses to idle after lifecycle.end('cleanup') completes.
 */
export type PreBindStatus =
	| { kind: 'idle' }
	| { kind: 'awaitingMediaCall'; uuid: string; host: string; cleanupAt: number }
	| { kind: 'failed'; uuid: string; reason: 'cleanup' | 'replayMismatch' }; // replayMismatch: slice 09

/** Internal state — superset of PreBindStatus; awaitingMediaCall carries queuedIntents. */
type PreBindState =
	| { kind: 'idle' }
	| { kind: 'awaitingMediaCall'; uuid: string; host: string; cleanupAt: number; queuedIntents: PreBindIntent[] }
	| { kind: 'failed'; uuid: string; reason: 'cleanup' | 'replayMismatch' };

// ── Event types ───────────────────────────────────────────────────────────────

export type CallEndReason = 'local' | 'remote' | 'rejected' | 'error' | 'cleanup'; // 'cleanup' produced by Pre-bind FSM cleanupAt elapse

export type CallEndedEvent = {
	callId: string | null;
	reason: CallEndReason;
};

export type CallBeganEvent = {
	callId: string;
};

export type PreBindFailedEvent = {
	uuid: string;
	reason: 'cleanup' | 'replayMismatch';
};

export type PreBindChangedEvent = {
	/** The new FSM state after the transition. */
	status: PreBindStatus;
};

export type CallLifecycleListener<T> = (event: T) => void;

type EventMap = {
	callBegan: CallBeganEvent; // type-only — no producer in this slice
	callEnded: CallEndedEvent;
	preBindFailed: PreBindFailedEvent;
	/**
	 * Fired on every Pre-bind FSM transition:
	 *   - idle → awaitingMediaCall (entry edge — native accepted)
	 *   - awaitingMediaCall → idle (matching newCall bound)
	 *   - awaitingMediaCall → idle (lifecycle.end called, e.g. local hangup during pre-bind)
	 *   - awaitingMediaCall → failed → idle (cleanupAt elapse; preBindFailed fires separately)
	 *
	 * Subscribers can use this to reactively gate UI (e.g. isInActiveVoipCall) on the
	 * FSM entry edge, not just the exit edge (callEnded / preBindFailed).
	 */
	preBindChanged: PreBindChangedEvent;
};

// ── Typed event emitter ───────────────────────────────────────────────────────

class CallLifecycleEmitter {
	private _listeners: { [K in keyof EventMap]?: Set<CallLifecycleListener<EventMap[K]>> } = {};

	on<K extends keyof EventMap>(event: K, listener: CallLifecycleListener<EventMap[K]>): () => void {
		if (!this._listeners[event]) {
			(this._listeners as any)[event] = new Set();
		}
		(this._listeners[event] as Set<CallLifecycleListener<EventMap[K]>>).add(listener);
		return () => this.off(event, listener);
	}

	off<K extends keyof EventMap>(event: K, listener: CallLifecycleListener<EventMap[K]>): void {
		(this._listeners[event] as Set<CallLifecycleListener<EventMap[K]>> | undefined)?.delete(listener);
	}

	emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
		const set = this._listeners[event] as Set<CallLifecycleListener<EventMap[K]>> | undefined;
		if (!set) return;
		for (const listener of set) {
			listener(payload);
		}
	}
}

// ── CallLifecycle ─────────────────────────────────────────────────────────────

class CallLifecycle {
	/** Typed event emitter for lifecycle events. */
	readonly emitter = new CallLifecycleEmitter();

	/**
	 * Optional override for the native seam — defaults to the module-level `voipNative` singleton.
	 * Use `attach()` to inject a custom adapter (e.g., a test double).
	 */
	private _voipNativeOverride: VoipNativePort | null = null;

	/** Re-entry guard: in-flight teardown promise, or null when idle. */
	private _endPromise: Promise<void> | null = null;

	/** Pre-bind FSM state (private — only preBindStatus() exposes it read-only). */
	private _preBind: PreBindState = { kind: 'idle' };

	/** Cleanup timer handle for awaitingMediaCall → failed('cleanup') transition. */
	private _cleanupTimer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Attach a custom native seam (optional). If not called, the module-level
	 * `voipNative` singleton is used. Call once per session for explicit injection.
	 *
	 * The active MediaCall is read directly from useCallStore.getState().call —
	 * MediaSessionInstance remains the owner; CallLifecycle only reads it.
	 */
	attach(nativeOverride: VoipNativePort): void {
		this._voipNativeOverride = nativeOverride;
	}

	/**
	 * Reset FSM state to idle. Intended for test teardown only.
	 * In production, FSM resets via end() or store.reset().
	 * @internal
	 */
	_resetForTesting(): void {
		this._transitionToIdle();
		this._endPromise = null;
	}

	/**
	 * Public read of the Pre-bind FSM state (read-only consumers).
	 * Strips internal `queuedIntents` from `awaitingMediaCall` before returning.
	 */
	preBindStatus(): PreBindStatus {
		if (this._preBind.kind === 'awaitingMediaCall') {
			const { kind, uuid, host, cleanupAt } = this._preBind;
			return { kind, uuid, host, cleanupAt };
		}
		return this._preBind;
	}

	/**
	 * Handle a native event from voipNative.attach({ onEvent }).
	 *
	 * Wired by the session initialiser (MediaSessionInstance or slice 09 cold-start
	 * router) when setting up the native event stream.
	 */
	handleNativeEvent(event: VoipNativeEvent): void {
		switch (event.type) {
			case 'acceptSucceeded':
				this._onNativeAnswer(event.payload);
				break;
			case 'mute':
				this._onPreBindIntent({ kind: 'mute', muted: event.muted }, event.callUuid);
				break;
			case 'hold':
				this._onPreBindIntent({ kind: 'hold', hold: event.hold }, event.callUuid);
				break;
			default:
				break;
		}
	}

	/**
	 * Called by MediaSignalingSession's `newCall` event for each new IClientMediaCall.
	 *
	 * If the FSM is in `awaitingMediaCall` and the callId matches:
	 *   1. FSM transitions to idle.
	 *   2. answerIncoming(callId) is called to bind the MediaCall.
	 *   3. Queued pre-bind intents (mute/hold) are flushed onto the bound call.
	 *      Order matters: bind before flush so localParticipant exists.
	 */
	async onMediaCallNew(call: IClientMediaCall): Promise<void> {
		if (this._preBind.kind !== 'awaitingMediaCall') {
			return;
		}
		if (this._preBind.uuid !== call.callId) {
			return;
		}

		// Capture intents before transitioning (transition clears them).
		const queuedIntents = this._preBind.queuedIntents.slice();

		// Transition FSM to idle first.
		this._transitionToIdle();

		// Bind: answer the incoming call.
		await this.answerIncoming(call.callId);

		// Flush queued pre-bind intents onto the now-bound MediaCall.
		// Prefer the call from the store (answerIncoming may have stored it there).
		const boundCall = useCallStore.getState().call ?? call;
		this._flushQueuedIntents(boundCall, queuedIntents);
	}

	/**
	 * Answer an incoming call by callId.
	 *
	 * Stub in this slice — slice 06 provides the full implementation.
	 * The Pre-bind FSM calls this internally when binding a matching MediaCall.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async answerIncoming(_callId: string): Promise<void> {
		// Full implementation provided by slice 06.
		// This stub ensures the FSM's internal call path compiles and tests can spy on it.
	}

	/**
	 * End the current call with the given reason.
	 *
	 * Idempotent: if a teardown is already in progress, concurrent callers
	 * receive the same in-flight Promise (one observable teardown sequence).
	 *
	 * Also resets any non-idle Pre-bind FSM state (handles concurrent local hangup
	 * vs cleanupAt elapse).
	 *
	 * Returns a Promise<void> that resolves when teardown is complete.
	 */
	end(reason: CallEndReason): Promise<void> {
		// Reset FSM on any end() call — handles concurrent local hangup vs cleanup elapse.
		this._transitionToIdle();

		if (this._endPromise) {
			// Concurrent caller — share the in-flight teardown.
			return this._endPromise;
		}
		this._endPromise = this._runTeardown(reason).finally(() => {
			this._endPromise = null;
		});
		return this._endPromise;
	}

	// eslint-disable-next-line require-await
	private async _runTeardown(reason: CallEndReason): Promise<void> {
		// Use explicit override if provided, otherwise fall back to the module-level singleton.
		const native = this._voipNativeOverride ?? voipNative;

		// Pre-bind FSM now owns the pre-bind UUID; store no longer holds nativeAcceptedCallId.
		const { callId } = useCallStore.getState();

		// Step 1: Hang up the MediaCall (reject if ringing, hangup otherwise).
		// Read the active call from useCallStore — MediaSessionInstance owns it.
		const mediaCall = useCallStore.getState().call;
		if (mediaCall) {
			if ((mediaCall as any).state === 'ringing') {
				mediaCall.reject();
			} else {
				mediaCall.hangup();
			}
		}

		// Step 2: End the native CallKit / Telecom session.
		if (callId) {
			native.call.end(callId);
		}

		// Step 3: Clear the "active" indicator in the native UI.
		native.call.markActive('');

		// Step 4: Mark the device as available for new calls.
		native.call.markAvailable(callId ?? '');

		// Step 5: Reset JS call state (store clears call, callId, etc.).
		// NOTE: stopAudio is intentionally NOT called here — step 6 owns it so
		// that all subscribers see consistent JS state when callEnded emits.
		// If reset() is called outside of CallLifecycle (e.g., on session teardown),
		// stopAudio is a safe no-op if audio was not started.
		useCallStore.getState().reset();

		// Step 6: Stop audio after store is cleared.
		native.call.stopAudio();

		// Step 7: Notify subscribers.
		this.emitter.emit('callEnded', { callId, reason });
	}

	// ── Pre-bind FSM private helpers ──────────────────────────────────────────

	private _onNativeAnswer(payload: VoipPayload): void {
		if (this._preBind.kind === 'awaitingMediaCall') {
			// Already awaiting a call — policy: first native answer wins.
			// A second acceptSucceeded with a different UUID is silently dropped.
			// Rationale: only one native call can be active at a time; the first
			// native accept transitions the FSM and starts the cleanup timer. A
			// spurious duplicate with a different UUID would require ending the
			// in-progress pre-bind window first (via lifecycle.end), which is not
			// done automatically here to avoid unintended teardown of a legitimate
			// pending call. If the first call's pre-bind expires, the cleanup path
			// resets the FSM to idle, at which point a new native answer is accepted.
			return;
		}

		const cleanupAt = Date.now() + CLEANUP_AT_OFFSET_MS;

		this._preBind = {
			kind: 'awaitingMediaCall',
			uuid: payload.callId,
			host: payload.host,
			cleanupAt,
			queuedIntents: []
		};

		// Emit preBindChanged on entry edge (idle → awaitingMediaCall).
		this.emitter.emit('preBindChanged', { status: this.preBindStatus() });

		// Schedule garbage collection at cleanupAt.
		this._scheduleCleanup(payload.callId);
	}

	private _scheduleCleanup(uuid: string): void {
		this._cancelCleanupTimer();
		this._cleanupTimer = setTimeout(() => {
			this._cleanupTimer = null;
			// Guard: only act if still awaiting the same uuid.
			if (this._preBind.kind !== 'awaitingMediaCall' || this._preBind.uuid !== uuid) {
				return;
			}

			// Transition to failed.
			this._preBind = { kind: 'failed', uuid, reason: 'cleanup' };

			// Emit preBindChanged on awaitingMediaCall → failed edge.
			// failed is transient; preBindFailed and a subsequent idle preBindChanged follow.
			this.emitter.emit('preBindChanged', { status: { kind: 'failed', uuid, reason: 'cleanup' } });

			// Emit preBindFailed so CallNavRouter can react.
			this.emitter.emit('preBindFailed', { uuid, reason: 'cleanup' });

			// Run lifecycle teardown ('cleanup' reason tag).
			// end() calls _transitionToIdle synchronously, which collapses FSM back to idle
			// (and emits preBindChanged { kind: 'idle' }) before _runTeardown runs async.
			this.end('cleanup').catch(() => {
				// end() is idempotent; errors here are non-fatal.
			});
		}, CLEANUP_AT_OFFSET_MS);
	}

	private _cancelCleanupTimer(): void {
		if (this._cleanupTimer != null) {
			clearTimeout(this._cleanupTimer);
			this._cleanupTimer = null;
		}
	}

	private _transitionToIdle(): void {
		const wasNonIdle = this._preBind.kind !== 'idle';
		this._cancelCleanupTimer();
		this._preBind = { kind: 'idle' };
		// Emit preBindChanged only when we actually transitioned (avoid spurious events
		// when already idle, e.g. repeated end() calls after teardown completes).
		if (wasNonIdle) {
			this.emitter.emit('preBindChanged', { status: { kind: 'idle' } });
		}
	}

	private _onPreBindIntent(intent: PreBindIntent, callUuid: string): void {
		if (this._preBind.kind !== 'awaitingMediaCall') {
			// Not in pre-bind window — intent is for a live call, handled elsewhere.
			return;
		}
		if (this._preBind.uuid !== callUuid) {
			// Intent for a different callUuid — ignore (stale or spurious).
			return;
		}
		const { queuedIntents } = this._preBind;
		if (queuedIntents.length >= PRE_BIND_INTENT_CAP) {
			// Cap reached: drop oldest intent before pushing the new one.
			// Overflow policy: drop oldest, keep newest (ring-buffer semantics).
			queuedIntents.shift();
		}
		queuedIntents.push(intent);
	}

	private _flushQueuedIntents(call: IClientMediaCall, intents: PreBindIntent[]): void {
		for (const intent of intents) {
			if (intent.kind === 'mute') {
				call.localParticipant.setMuted?.(intent.muted);
			} else if (intent.kind === 'hold') {
				call.localParticipant.setHeld?.(intent.hold);
			}
		}
	}
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const callLifecycle = new CallLifecycle();
