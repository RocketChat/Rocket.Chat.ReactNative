interface IOptimisticUpdate {
	pinned?: boolean;
	timestamp: number;
}

const optimisticUpdates: Map<string, IOptimisticUpdate> = new Map();
const CLEANUP_THRESHOLD = 10000;

const cleanupStaleUpdates = (maxAge: number = CLEANUP_THRESHOLD) => {
	const now = Date.now();
	for (const [messageId, update] of optimisticUpdates.entries()) {
		const age = now - update.timestamp;
		if (age >= maxAge) {
			optimisticUpdates.delete(messageId);
		}
	}
};

export const registerOptimisticUpdate = (messageId: string, update: { pinned?: boolean }) => {
	cleanupStaleUpdates();
	optimisticUpdates.set(messageId, {
		...update,
		timestamp: Date.now()
	});
};

export const getOptimisticUpdate = (messageId: string): IOptimisticUpdate | undefined => {
	cleanupStaleUpdates();
	return optimisticUpdates.get(messageId);
};

export const clearOptimisticUpdate = (messageId: string) => {
	optimisticUpdates.delete(messageId);
};

export const isRecentOptimisticUpdate = (messageId: string, maxAge: number = 2000): boolean => {
	cleanupStaleUpdates();
	const update = optimisticUpdates.get(messageId);
	if (!update) return false;
	const age = Date.now() - update.timestamp;
	return age < maxAge;
};
