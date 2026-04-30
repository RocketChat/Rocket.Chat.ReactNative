/**
 * CallLifecycle — orchestrates call lifecycle transitions.
 *
 * Teardown order (end):
 *   1. mediaCall.reject() if state === 'ringing', else mediaCall.hangup()
 *   2. voipNative.call.end(callUuid)
 *   3. voipNative.call.markActive('')
 *   4. voipNative.call.markAvailable(callUuid)
 *   5. useCallStore.reset()        ← clears JS state; stopAudio removed from here (step 6 owns it)
 *   6. voipNative.call.stopAudio() ← fires after store reset so subscribers see consistent state
 *   7. emit callEnded { callId, reason }
 *
 * answerIncoming(callId) order:
 *   1. Concurrent-call guard — deduplicate via _answerPromises Map (per-callId in-flight promise)
 *   2. Idempotency guard — return if store.call.callId === callId (already answered)
 *   3. mediaCall = mediaSessionInstance.getMediaCall(callId) — abort if null
 *   4. mediaCall.accept()
 *   5. voipNative.call.markActive(callId)
 *   6. voipNative.call.startAudio()
 *   7. useCallStore.setCall(mediaCall) + setDirection('incoming')
 *   8. resolveRoomIdFromContact(mediaCall) → setRoomId
 *   9. emit callBegan { callId, direction: 'incoming', roomId? }
 *
 * beginOutgoing(call, room?) order:
 *   1. voipNative.call.markActive(call.callId)
 *   2. voipNative.call.startAudio()
 *   3. useCallStore.setCall(call) + setDirection('outgoing') + setRoomId(room?.rid)
 *   4. if no room argument, resolveRoomIdFromContact(remoteParticipants[0]?.contact) → setRoomId
 *   5. emit callBegan { callId, direction: 'outgoing', roomId? }
 *
 * Idempotency: concurrent end() callers receive the in-flight Promise (no double teardown).
 *              concurrent answerIncoming() callers for the same callId share the in-flight Promise.
 *              sequential answerIncoming() re-entry with same callId returns early via store check.
 *
 * `callId` in `callEnded` uses `callId ?? nativeAcceptedCallId` (Pre-bind-safe).
 */

import type { CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';

import { MediaCallLogger } from './MediaCallLogger';
import { voipNative, type VoipNativePort } from './VoipNative';
import { useCallStore } from './useCallStore';

const logger = new MediaCallLogger();
const TAG = '[CallLifecycle]';

// Lazy imports — avoids pulling WatermelonDB (Subscription.ts) and the circular MediaSessionInstance at module
// load time. Neither is needed until the first answerIncoming/beginOutgoing call.

function _requireMediaSessionInstance(): { getMediaCall(callId: string): IClientMediaCall | null | undefined } {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./MediaSessionInstance').mediaSessionInstance;
}

function _getDMSubscriptionByUsername(username: string): Promise<{ rid: string } | null> {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { getDMSubscriptionByUsername } = require('../../database/services/Subscription');
	return getDMSubscriptionByUsername(username) as Promise<{ rid: string } | null>;
}

// ── Event types ───────────────────────────────────────────────────────────────

export type CallEndReason = 'local' | 'remote' | 'rejected' | 'error' | 'cleanup'; // 'cleanup' reserved for slice 08 Pre-bind FSM cleanupAt elapse

export type CallEndedEvent = {
	callId: string | null;
	reason: CallEndReason;
};

export type CallBeganEvent = {
	callId: string;
	direction: 'incoming' | 'outgoing';
	roomId?: string;
};

export type PreBindFailedEvent = {
	callId: string | null;
};

export type CallLifecycleListener<T> = (event: T) => void;

type EventMap = {
	callBegan: CallBeganEvent;
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
		// Snapshot the set before iterating so listeners can safely add/remove
		// other listeners mid-emit. Wrap each invocation in try/catch so a
		// throwing listener does not skip subsequent listeners or propagate up
		// to `_runTeardown` and reject the `_endPromise` after teardown completed.
		for (const listener of [...set]) {
			try {
				listener(payload);
			} catch (error) {
				logger.warn(`${TAG} ${String(event)} listener failed; continuing emit`, error);
			}
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
	 * Per-callId in-flight answer promises.
	 * Concurrent answerIncoming() callers for the same callId receive the same Promise —
	 * preventing double accept(), double markActive/startAudio, and double callBegan emission.
	 */
	private _answerPromises = new Map<string, Promise<void>>();

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

	/**
	 * Answer an incoming call.
	 *
	 * Concurrent-safe: if two callers invoke answerIncoming() for the same callId simultaneously,
	 * they both receive the same in-flight Promise — only one accept/markActive/startAudio/callBegan
	 * sequence runs. The Map entry is removed once the promise settles (success or error).
	 *
	 * Idempotent (sequential): re-entry with the same callId after it is already bound in the store
	 * returns early inside _runAnswer — no double-accept, no extra native commands.
	 *
	 * Order: (concurrent guard) → (idempotency guard) → accept → markActive → startAudio →
	 *        setCall + setDirection → resolveRoomIdFromContact → emit callBegan.
	 *
	 * NOTE: intentionally NOT declared async — the body must return the stored Promise directly so
	 * that concurrent callers receive the exact same Promise object (identity equality).
	 * An `async` wrapper would create a new wrapping Promise for each caller.
	 */
	answerIncoming(callId: string): Promise<void> {
		// Concurrent-call guard: deduplicate in-flight promises per callId.
		const existing = this._answerPromises.get(callId);
		if (existing) return existing;
		const p = this._runAnswer(callId);
		this._answerPromises.set(callId, p);
		p.finally(() => this._answerPromises.delete(callId)).catch(() => {});
		return p;
	}

	private async _runAnswer(callId: string): Promise<void> {
		const native = this._voipNativeOverride ?? voipNative;

		// Step 1: Idempotency guard — return if already answered (sequential re-entry).
		const { call: existingCall } = useCallStore.getState();
		if (existingCall != null && existingCall.callId === callId) {
			return;
		}

		// Step 2: Look up the MediaCall from the signaling session.
		const mediaCall = _requireMediaSessionInstance().getMediaCall(callId);
		if (!mediaCall || mediaCall.callId !== callId) {
			// Call not found — clean up native state and pre-bind tracking.
			native.call.end(callId);
			const st = useCallStore.getState();
			if (st.nativeAcceptedCallId === callId) {
				st.resetNativeCallId();
			}
			console.warn('[VoIP] Call not found after accept:', callId);
			return;
		}

		// Step 3: Accept the call on the signaling layer.
		await mediaCall.accept();

		// Step 4: Tell native the call is active.
		native.call.markActive(callId);

		// Step 5: Start audio.
		native.call.startAudio();

		// Step 6: Update JS store — state only (native side-effects already done above).
		useCallStore.getState().setCall(mediaCall);
		useCallStore.getState().setDirection('incoming');

		// Step 7: Resolve room id from contact (async; store updated before callBegan emits).
		const roomId = await this._resolveRoomIdFromContact(mediaCall.remoteParticipants[0]?.contact);
		if (roomId) {
			useCallStore.getState().setRoomId(roomId);
		}

		// Step 8: Notify subscribers.
		this.emitter.emit('callBegan', { callId, direction: 'incoming', ...(roomId ? { roomId } : {}) });
	}

	/**
	 * Begin the outgoing-call side effects.
	 *
	 * Called from the `newCall` handler's `role === 'caller'` branch in MediaSessionInstance.
	 * The IClientMediaCall already exists at this point (produced by the `newCall` event).
	 *
	 * When `room` is omitted (DM-by-username path: CreateCall → startCall(userId, 'user')
	 * never sets a roomId beforehand), the room id is resolved from the remote participant's
	 * contact via getDMSubscriptionByUsername — pre-refactor parity, otherwise CallView's
	 * "Go to chat" button stays disabled because roomId is null.
	 *
	 * Order: markActive → startAudio → setCall + setDirection + setRoomId →
	 *        (fallback) resolveRoomIdFromContact → emit callBegan.
	 */
	async beginOutgoing(call: IClientMediaCall, room?: { rid?: string }): Promise<void> {
		const native = this._voipNativeOverride ?? voipNative;

		// Step 1: Tell native the call is active.
		native.call.markActive(call.callId);

		// Step 2: Start audio.
		native.call.startAudio();

		// Step 3: Update JS store — state only (native side-effects already done above).
		useCallStore.getState().setCall(call);
		useCallStore.getState().setDirection('outgoing');
		useCallStore.getState().setRoomId(room?.rid ?? null);

		// Step 4: Fallback DM lookup when caller didn't supply a room (CreateCall by username).
		let resolvedRoomId: string | undefined = room?.rid;
		if (room?.rid == null) {
			const fromContact = await this._resolveRoomIdFromContact(call.remoteParticipants[0]?.contact);
			if (fromContact) {
				useCallStore.getState().setRoomId(fromContact);
				resolvedRoomId = fromContact;
			}
		}

		// Step 5: Notify subscribers.
		this.emitter.emit('callBegan', {
			callId: call.callId,
			direction: 'outgoing',
			...(resolvedRoomId ? { roomId: resolvedRoomId } : {})
		});
	}

	/**
	 * Resolve the DM room id from a call contact.
	 * Returns undefined if the contact has no username or no subscription is found.
	 */
	private async _resolveRoomIdFromContact(contact: CallContact | undefined): Promise<string | undefined> {
		if (!contact?.username) {
			return undefined;
		}
		const sub = await _getDMSubscriptionByUsername(contact.username);
		return sub?.rid ?? undefined;
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
