/**
 * Call ids the user tried to hang up while the WebSocket was unhealthy. The reconnect listener in
 * `connect.ts` drains this on the next post-login `'connected'` by calling
 * `MediaSessionInstance.drainPendingHangups`, which re-dispatches a hangup Media Signal through the
 * lib's transporter so the server can terminate the phantom call. Entries are removed when the lib
 * emits the call's `'ended'` event (server-confirmed termination).
 */
const pendingIds = new Set<string>();

export const pendingHangups = {
	record(callId: string): void {
		pendingIds.add(callId);
	},
	remove(callId: string): void {
		pendingIds.delete(callId);
	},
	drainAll(): string[] {
		const ids = Array.from(pendingIds);
		pendingIds.clear();
		return ids;
	},
	get size(): number {
		return pendingIds.size;
	},
	clear(): void {
		pendingIds.clear();
	}
};
