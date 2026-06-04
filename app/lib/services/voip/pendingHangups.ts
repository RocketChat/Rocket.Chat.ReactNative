// Hangup call ids replayed on post-reconnect drain. Server-side hangup is idempotent — entries
// can sit in the set after a successful wire-level hangup without re-terminating live calls.
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
