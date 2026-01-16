/**
 * Pending Call Store
 * Stores call info from VoIP push notifications so JS can handle them when waking up.
 * This is needed for the "app killed" scenario where native receives the VoIP push
 * and shows CallKit before JS is fully initialized.
 */

export interface PendingCall {
	/** The server's call identifier */
	callId: string;
	/** The CallKit UUID (derived from callId via UUID v5) */
	callUUID: string;
	/** Caller display name */
	caller: string;
	/** Server host URL (for server switching if needed) */
	host?: string;
	/** Timestamp when the call was received */
	receivedAt: number;
	/** Timestamp when the user answered (if answered) */
	answeredAt?: number;
	/** Timestamp when the user declined (if declined) */
	declinedAt?: number;
}

let pendingCall: PendingCall | null = null;

/**
 * Set a pending call from VoIP push notification.
 * Called from index.js when a VoIP notification is received.
 */
export const setPendingCall = (call: Omit<PendingCall, 'receivedAt'>): void => {
	pendingCall = {
		...call,
		receivedAt: Date.now()
	};
	console.log('[VoIP] Pending call set:', pendingCall.callId);
};

/**
 * Get the current pending call (if any).
 */
export const getPendingCall = (): PendingCall | null => {
	return pendingCall;
};

/**
 * Mark the pending call as answered.
 * Called when user answers via CallKit.
 */
export const markPendingCallAnswered = (): void => {
	if (pendingCall) {
		pendingCall.answeredAt = Date.now();
		console.log('[VoIP] Pending call marked as answered:', pendingCall.callId);
	}
};

/**
 * Mark the pending call as declined.
 * Called when user declines via CallKit.
 */
export const markPendingCallDeclined = (): void => {
	if (pendingCall) {
		pendingCall.declinedAt = Date.now();
		console.log('[VoIP] Pending call marked as declined:', pendingCall.callId);
	}
};

/**
 * Clear the pending call.
 * Called after the call has been processed by MediaSessionInstance.
 */
export const clearPendingCall = (): void => {
	if (pendingCall) {
		console.log('[VoIP] Pending call cleared:', pendingCall.callId);
	}
	pendingCall = null;
};

/**
 * Check if there's a pending answered call.
 */
export const hasPendingAnsweredCall = (): boolean => {
	return pendingCall !== null && pendingCall.answeredAt !== undefined && pendingCall.declinedAt === undefined;
};

/**
 * Check if there's any pending call.
 */
export const hasPendingCall = (): boolean => {
	return pendingCall !== null;
};
