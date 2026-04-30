/**
 * CallLifecycle — orchestrates call-state transitions.
 *
 * ## End-of-call teardown (CallLifecycle.end)
 *
 * Teardown order (documented here and verified in tests):
 *   1. mediaCall.reject() if state === 'ringing', else mediaCall.hangup()
 *   2. voipNative.call.end(callUuid)
 *   3. voipNative.call.markActive('')
 *   4. voipNative.call.markAvailable(callUuid)
 *   5. useCallStore.reset()        — clears JS state
 *   6. voipNative.call.stopAudio() — fires after store reset so subscribers see consistent state
 *   7. emit callEnded { callId, reason }
 *
 * Idempotency: concurrent callers receive the in-flight Promise (no double teardown).
 *
 * `callId` in the `callEnded` event uses `callId ?? nativeAcceptedCallId` (Pre-bind-safe).
 *
 * ## Toggle transitions (CallLifecycle.toggle)
 *
 * `toggle(kind, source?, callUuid?, targetValue?)` handles mute, hold, and speaker toggles.
 *
 * `source` encodes where the intent originated:
 *   - `'js'`: user-initiated from the JS UI. Updates store, mutates localParticipant,
 *             and where applicable issues a voipNative command (e.g. setSpeaker).
 *   - `'native'`: OS-initiated (CallKit / Telecom). Updates store and mutates
 *             localParticipant ONLY — does NOT issue a voipNative command back,
 *             preventing the OS→JS→OS echo loop.
 *             Exception: `toggle('hold', 'native')` auto-resume issues `markActive`
 *             when the OS releases a hold it previously placed (wasAutoHeld).
 *             This is intentional — markActive is a different kind of command,
 *             not an echo of the hold event itself.
 *
 * `targetValue` — when provided, the toggle uses this as the desired new value rather
 * than flipping the current value. This makes the toggle idempotent: if `targetValue`
 * matches the current store value, the call is a no-op (no store change, no native
 * command, no `_wasAutoHeld` mutation). Used by `'native'` callers to honour OS payload
 * assertions (e.g. `e.hold`, `e.muted`). `'js'` callers omit `targetValue` and keep
 * flip semantics unchanged.
 *
 * Stale-UUID drop: when `callUuid` is provided it must match the active callId or
 * nativeAcceptedCallId (case-insensitive). Mismatched UUIDs are no-ops for mute and
 * speaker; for `kind='hold'`, a stale-UUID drop also clears `_wasAutoHeld`. This applies
 * uniformly to all kinds and both platforms — no isIOS branch.
 *
 * `wasAutoHeld` is private state owned by CallLifecycle (not useCallStore, not MediaCallEvents).
 */

import { voipNative, type VoipNativePort } from './VoipNative';
import { useCallStore } from './useCallStore';

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

export type ToggleKind = 'mute' | 'hold' | 'speaker';
export type ToggleSource = 'js' | 'native';

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
	 * Tracks whether the most recent hold was OS-initiated (auto-held by CallKit/Telecom).
	 * When the OS releases the hold, we re-issue `markActive` to restore the native UI.
	 * This is the only documented carve-out from the "native source issues no commands" rule.
	 * Owned here, not in useCallStore or MediaCallEvents.
	 */
	private _wasAutoHeld = false;

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
		this._endPromise = this._runTeardown(reason).finally(() => {
			this._endPromise = null;
		});
		return this._endPromise;
	}

	/**
	 * Toggle mute, hold, or speaker state.
	 *
	 * @param kind        — which toggle to perform
	 * @param source      — `'js'` (user intent) or `'native'` (OS intent). Defaults to `'js'`.
	 * @param callUuid    — optional UUID for stale-event validation. When provided, the toggle
	 *                      is a no-op if the UUID does not match the active call or nativeAcceptedCallId.
	 *                      For `kind='hold'`, a stale-UUID drop also clears `_wasAutoHeld`.
	 * @param targetValue — optional target value. When provided, the toggle uses this as the
	 *                      desired new value (idempotent: no-op when it matches current state).
	 *                      When omitted, flip semantics apply (current behaviour for 'js' callers).
	 *
	 * Returns `Promise<void>` (only speaker is async; mute/hold resolve immediately).
	 */
	toggle(kind: ToggleKind, source: ToggleSource = 'js', callUuid?: string, targetValue?: boolean): Promise<void> {
		const native = this._voipNativeOverride ?? voipNative;
		const { call, callId, nativeAcceptedCallId, isMuted, isOnHold, isSpeakerOn } = useCallStore.getState();

		// ── Stale-UUID drop ──────────────────────────────────────────────────────
		// When a callUuid is provided, validate it against the active call.
		// Applies uniformly to all kinds and both platforms — no isIOS branch.
		// For kind='hold', a stale drop also defensively clears _wasAutoHeld.
		if (callUuid !== undefined) {
			const activeUuid = (callId ?? nativeAcceptedCallId ?? '').toLowerCase();
			if (!activeUuid || callUuid.toLowerCase() !== activeUuid) {
				if (kind === 'hold') {
					// Defensive clear: a stale hold event for a dead call must not leave
					// _wasAutoHeld=true, which could cause a spurious markActive on the
					// next call's auto-resume path.
					this._wasAutoHeld = false;
				}
				// Stale event — drop silently.
				return Promise.resolve();
			}
		}

		// ── Guard: require an active call for all toggle kinds ──────────────────
		if (!call) {
			return Promise.resolve();
		}

		switch (kind) {
			case 'mute': {
				// Derive effective new value: targetValue wins over flip semantics.
				const newMuted = targetValue ?? !isMuted;
				// Idempotent: if the target value already matches current state, do nothing.
				if (newMuted === isMuted) return Promise.resolve();
				call!.localParticipant.setMuted(newMuted);
				useCallStore.setState({ isMuted: newMuted });
				// Echo prevention: 'native' source does NOT issue a voipNative command.
				// 'js' source also records no command today — no RNCallKeep setMuted exists.
				// This guard is forward-compatibility scaffolding for when a native mute
				// command lands (e.g. Android-only). The directionality is tested via speaker.
				return Promise.resolve();
			}

			case 'hold': {
				// Derive effective new value: targetValue wins over flip semantics.
				const newHeld = targetValue ?? !isOnHold;
				// Idempotent: if the target value already matches current state, do nothing.
				// Honours OS payload assertions — a redundant hold:true while already held,
				// or a late hold:false after the user already resumed, must be a no-op so we
				// don't flip state, mutate _wasAutoHeld, or fire a spurious markActive.
				if (newHeld === isOnHold) return Promise.resolve();
				call!.localParticipant.setHeld(newHeld);
				useCallStore.setState({ isOnHold: newHeld });

				if (source === 'native') {
					if (newHeld) {
						// OS placed the call on hold — record for auto-resume.
						this._wasAutoHeld = true;
					} else if (this._wasAutoHeld) {
						// OS released the hold it previously placed — re-issue markActive.
						// This is the documented per-kind exception to the no-echo rule:
						// markActive is not an echo of the hold event; it restores native UI.
						const effectiveCallId = callId ?? nativeAcceptedCallId ?? callUuid ?? '';
						if (effectiveCallId) {
							native.call.markActive(effectiveCallId);
						}
						this._wasAutoHeld = false;
					}
					// No other voipNative commands for 'native' source.
				} else {
					// 'js' source: no RNCallKeep setHeld command exists today.
					// Guard is forward-compatibility scaffolding (same as mute).
					this._wasAutoHeld = false;
				}
				return Promise.resolve();
			}

			case 'speaker': {
				if (source === 'native') {
					// Reserved for future audio-route-sync work (slice follow-up).
					// Out of scope for slice 07 — no-op here so audio-route-sync can
					// continue writing isSpeakerOn directly via setState.
					return Promise.resolve();
				}
				// 'js' source: issue native command and update store.
				// Speaker keeps flip semantics — targetValue is ignored (always flip for 'js').
				const newSpeakerOn = !isSpeakerOn;
				return native.call.setSpeaker(newSpeakerOn).then(() => {
					useCallStore.setState({ isSpeakerOn: newSpeakerOn });
				});
			}
		}
	}

	// eslint-disable-next-line require-await
	private async _runTeardown(reason: CallEndReason): Promise<void> {
		// Use explicit override if provided, otherwise fall back to the module-level singleton.
		const native = this._voipNativeOverride ?? voipNative;

		const { callId, nativeAcceptedCallId } = useCallStore.getState();
		// Pre-bind-safe: use whichever id is available.
		const effectiveCallId = callId ?? nativeAcceptedCallId;

		// Read the active call from useCallStore — MediaSessionInstance owns it.
		const mediaCall = useCallStore.getState().call;
		if (mediaCall) {
			if ((mediaCall as any).state === 'ringing') {
				mediaCall.reject();
			} else {
				mediaCall.hangup();
			}
		}

		if (effectiveCallId) {
			native.call.end(effectiveCallId);
		}

		native.call.markActive('');
		native.call.markAvailable(effectiveCallId ?? '');

		// Reset JS state BEFORE stopAudio so that all callEnded subscribers see a
		// consistent cleared store when audio actually stops.
		useCallStore.getState().reset();

		// callLifecycle is a module singleton — clear instance flags so the next
		// call starts fresh and a stale auto-held bit cannot trigger a spurious
		// markActive on the next OS hold:false event.
		this._wasAutoHeld = false;

		native.call.stopAudio();

		this.emitter.emit('callEnded', { callId: effectiveCallId, reason });
	}
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const callLifecycle = new CallLifecycle();
