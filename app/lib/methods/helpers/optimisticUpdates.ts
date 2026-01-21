interface IOptimisticUpdate {
	pinned?: boolean;
	timestamp: number;
}

const optimisticUpdates: Map<string, IOptimisticUpdate> = new Map();

export const registerOptimisticUpdate = (messageId: string, update: { pinned?: boolean }) => {
	optimisticUpdates.set(messageId, {
		...update,
		timestamp: Date.now()
	});
};

export const getOptimisticUpdate = (messageId: string): IOptimisticUpdate | undefined => optimisticUpdates.get(messageId);

export const clearOptimisticUpdate = (messageId: string) => {
	optimisticUpdates.delete(messageId);
};

export const isRecentOptimisticUpdate = (messageId: string, maxAge: number = 2000): boolean => {
	const update = optimisticUpdates.get(messageId);
	if (!update) return false;
	const age = Date.now() - update.timestamp;
	return age < maxAge;
};
