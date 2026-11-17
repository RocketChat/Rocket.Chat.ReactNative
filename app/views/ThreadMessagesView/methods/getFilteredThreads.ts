import { type IThreadUnreads } from '../hooks/useRoomSubscription';
import { Filter } from '../filters';
import { type TThreadRow } from '../types';

const getFilteredThreads = <T extends TThreadRow>(threads: T[], userId: string, unreads: IThreadUnreads, filter: Filter): T[] => {
	if (filter === Filter.Following) {
		return threads.filter(thread => thread.replies?.includes(userId));
	}
	if (filter === Filter.Unread) {
		const unreadThreadIds = new Set(unreads.tunread);
		return threads.filter(thread => unreadThreadIds.has(thread.id));
	}
	return threads;
};

export default getFilteredThreads;
