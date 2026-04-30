/**
 * CallLifecycle — orchestrates the end-of-call teardown sequence.
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
 * `callId` in the `callEnded` event uses `callId ?? nativeAcceptedCallId` (Pre-bind-safe).
 */

import { MediaCallLogger } from './MediaCallLogger';
import { voipNative, type VoipNativePort } from './VoipNative';
import { useCallStore } from './useCallStore';

const logger = new MediaCallLogger();
const TAG = '[CallLifecycle]';

// ── Event types ───────────────────────────────────────────────────────────────

export type CallEndReason = 'local' | 'remote' | 'rejected' | 'error' | 'cleanup'; // 'cleanup' reserved for slice 08 Pre-bind FSM cleanupAt elapse

export type CallEndedEvent = {
	callId: string | null;
	reason: CallEndReason;
};

export type CallBeganEvent = {
	callId: string;
};

export type PreBindFailedEvent = {
	callId: string | null;
};

export type CallLifecycleListener<T> = (event: T) => void;

type EventMap = {
	callBegan: CallBeganEvent; // type-only — no producer in this slice
	callEnded: CallEndedEvent;
	preBindFailed: PreBindFailedEvent; // type-only — no producer in this slice
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
	 * End the current call with the given reason.
	 *
	 * Idempotent: if a teardown is already in progress, concurrent callers
	 * receive the same in-flight Promise (one observable teardown sequence).
	 *
	 * Returns a Promise<void> that resolves when teardown is complete.
	 */
	end(reason: CallEndReason): Promise<void> {
		if (this._endPromise) {
			// Concurrent caller — share the in-flight teardown.
			return this._endPromise;
		}
		// Defer the teardown body to a microtask so `_endPromise` is assigned BEFORE
		// `_runTeardown` runs. This guarantees that any synchronous re-entry from
		// inside teardown (e.g. mediaCall.hangup() emits 'ended' synchronously and
		// useCallStore's handleEnded re-calls callLifecycle.end('remote')) hits the
		// guard above and shares the in-flight promise instead of starting a second
		// teardown. See @rocket.chat/media-signaling Call.js line 703.
		this._endPromise = Promise.resolve()
			.then(() => this._runTeardown(reason))
			.finally(() => {
				this._endPromise = null;
			});
		return this._endPromise;
	}

	// eslint-disable-next-line require-await
	private async _runTeardown(reason: CallEndReason): Promise<void> {
		// Use explicit override if provided, otherwise fall back to the module-level singleton.
		const native = this._voipNativeOverride ?? voipNative;

		const { callId, nativeAcceptedCallId } = useCallStore.getState();
		// Pre-bind-safe: use whichever id is available.
		const effectiveCallId = callId ?? nativeAcceptedCallId;

		// `safe` wraps each teardown step so that a throw is logged but does not
		// abort the rest of the sequence. Without this, a single failure (e.g.
		// native.call.end throwing) would skip subsequent steps and leak the
		// `callEnded` emit, leaving listeners subscribed and native state stale.
		const safe = (label: string, fn: () => void) => {
			try {
				fn();
			} catch (error) {
				logger.warn(`${TAG} ${label} failed; continuing teardown`, error);
			}
		};

		// Step 1: Hang up the MediaCall (reject if ringing, hangup otherwise).
		// Read the active call from useCallStore — MediaSessionInstance owns it.
		const mediaCall = useCallStore.getState().call;
		if (mediaCall) {
			const isRinging = (mediaCall as any).state === 'ringing';
			safe(`mediaCall.${isRinging ? 'reject' : 'hangup'}`, () => {
				if (isRinging) {
					mediaCall.reject();
				} else {
					mediaCall.hangup();
				}
			});
		}

		// Step 2: End the native CallKit / Telecom session.
		if (effectiveCallId) {
			safe('native.call.end', () => native.call.end(effectiveCallId));
		}

		// Step 3: Clear the "active" indicator in the native UI.
		safe('native.call.markActive', () => native.call.markActive(''));

		// Step 4: Mark the device as available for new calls.
		safe('native.call.markAvailable', () => native.call.markAvailable(effectiveCallId ?? ''));

		// Step 5: Reset JS call state (store clears call, callId, etc.).
		// NOTE: stopAudio is intentionally NOT called here — step 6 owns it so
		// that all subscribers see consistent JS state when callEnded emits.
		safe('useCallStore.reset', () => useCallStore.getState().reset());

		// Step 6: Stop audio after store is cleared.
		safe('native.call.stopAudio', () => native.call.stopAudio());

		// Step 7: Notify subscribers.
		this.emitter.emit('callEnded', { callId: effectiveCallId, reason });
	}
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const callLifecycle = new CallLifecycle();
