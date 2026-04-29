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
 *   1. Idempotency guard — return if store.call.callId === callId
 *   2. mediaCall = mediaSessionInstance.getMediaCall(callId) — abort if null
 *   3. mediaCall.accept()
 *   4. voipNative.call.markActive(callId)
 *   5. voipNative.call.startAudio()
 *   6. useCallStore.setCallStateOnly(mediaCall) + setDirection('incoming')
 *   7. resolveRoomIdFromContact(mediaCall) → setRoomId
 *   8. emit callBegan { callId, direction: 'incoming', roomId? }
 *
 * beginOutgoing(call, room?) order:
 *   1. voipNative.call.markActive(call.callId)
 *   2. voipNative.call.startAudio()
 *   3. useCallStore.setCallStateOnly(call) + setDirection('outgoing') + setRoomId(room?.rid)
 *   4. emit callBegan { callId, direction: 'outgoing', roomId? }
 *
 * Idempotency: concurrent end() callers receive the in-flight Promise (no double teardown).
 *              answerIncoming re-entry with same callId returns early.
 *
 * `callId` in `callEnded` uses `callId ?? nativeAcceptedCallId` (Pre-bind-safe).
 */

import type { CallContact, IClientMediaCall } from '@rocket.chat/media-signaling';

import { voipNative, type VoipNativePort } from './VoipNative';
import { useCallStore } from './useCallStore';

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
		this._endPromise = this._runTeardown(reason).finally(() => {
			this._endPromise = null;
		});
		return this._endPromise;
	}

	/**
	 * Answer an incoming call.
	 *
	 * Idempotent: re-entry with the same callId is a no-op (no double-accept,
	 * no extra native commands, no duplicate callBegan emission).
	 *
	 * Order: accept → markActive → startAudio → setCallStateOnly + setDirection →
	 *        resolveRoomIdFromContact → emit callBegan.
	 */
	async answerIncoming(callId: string): Promise<void> {
		const native = this._voipNativeOverride ?? voipNative;

		// Step 1: Idempotency guard — return if already answered.
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
		useCallStore.getState().setCallStateOnly(mediaCall);
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
	 * Order: markActive → startAudio → setCallStateOnly + setDirection + setRoomId →
	 *        emit callBegan.
	 */
	// eslint-disable-next-line require-await
	async beginOutgoing(call: IClientMediaCall, room?: { rid?: string }): Promise<void> {
		const native = this._voipNativeOverride ?? voipNative;

		// Step 1: Tell native the call is active.
		native.call.markActive(call.callId);

		// Step 2: Start audio.
		native.call.startAudio();

		// Step 3: Update JS store — state only (native side-effects already done above).
		useCallStore.getState().setCallStateOnly(call);
		useCallStore.getState().setDirection('outgoing');
		useCallStore.getState().setRoomId(room?.rid ?? null);

		// Step 4: Notify subscribers.
		this.emitter.emit('callBegan', { callId: call.callId, direction: 'outgoing', ...(room?.rid ? { roomId: room.rid } : {}) });
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
		if (effectiveCallId) {
			native.call.end(effectiveCallId);
		}

		// Step 3: Clear the "active" indicator in the native UI.
		native.call.markActive('');

		// Step 4: Mark the device as available for new calls.
		native.call.markAvailable(effectiveCallId ?? '');

		// Step 5: Reset JS call state (store clears call, callId, etc.).
		// NOTE: stopAudio is intentionally NOT called here — step 6 owns it so
		// that all subscribers see consistent JS state when callEnded emits.
		useCallStore.getState().reset();

		// Step 6: Stop audio after store is cleared.
		native.call.stopAudio();

		// Step 7: Notify subscribers.
		this.emitter.emit('callEnded', { callId: effectiveCallId, reason });
	}
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const callLifecycle = new CallLifecycle();
