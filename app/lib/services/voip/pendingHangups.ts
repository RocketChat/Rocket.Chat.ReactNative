/**
 * Call ids the user tried to hang up while the WebSocket was unhealthy. The reconnect listener in
 * `connect.ts` drains this on the next post-login `'connected'` by calling
 * `MediaSessionInstance.drainPendingHangups`, which re-dispatches a hangup Media Signal through the
 * lib's transporter so the server can terminate the phantom call. Entries persist until either a
 * successful drain on reconnect or `MediaSessionInstance.reset()` (disconnect / init / server switch).
 * Server-side hangup is idempotent, so a replay against an already-terminated call is a no-op.
 */
const pendingIds = new Set<string>();

export const pendingHangups = {
	record(callId: string): void {
		pendingIds.add(callId);
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
