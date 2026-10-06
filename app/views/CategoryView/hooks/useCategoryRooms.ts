import { useMemo } from 'react';

import { roomsInSection } from '~/views/RoomsListView/utils/groupRooms';
import { useSubscriptions } from '~/views/RoomsListView/hooks/useSubscriptions';

const NO_COLLAPSED_GROUPS: ReadonlySet<string> = new Set();

export const useCategoryRooms = (header: string) => {
	const { subscriptions, loading } = useSubscriptions(NO_COLLAPSED_GROUPS);
	const rooms = useMemo(() => roomsInSection(subscriptions, header), [subscriptions, header]);
	return { rooms, loading };
};
