let openSwipeItem: { rid: string; close: () => void } | null = null;

export const registerOpenSwipeItem = (rid: string, close: () => void) => {
	openSwipeItem = { rid, close };
};

export const unregisterOpenSwipeItem = (rid: string) => {
	if (openSwipeItem?.rid === rid) {
		openSwipeItem = null;
	}
};

export const closeOpenSwipeItem = (exceptRid?: string) => {
	if (openSwipeItem && openSwipeItem.rid !== exceptRid) {
		openSwipeItem.close();
		openSwipeItem = null;
		return true;
	}
	return false;
};
