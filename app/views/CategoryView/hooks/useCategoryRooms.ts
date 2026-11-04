import { useMemo } from 'react';

import i18n from '~/i18n';
import { roomsInSection } from '~/views/RoomsListView/utils/groupRooms';
import { useSubscriptions } from '~/views/RoomsListView/hooks/useSubscriptions';

const NO_COLLAPSED_GROUPS: ReadonlySet<string> = new Set();

export type CategorySection = {
	header: string;
	title: string;
};

export const useCategoryRooms = (header: string) => {
	const { subscriptions, loading } = useSubscriptions(NO_COLLAPSED_GROUPS);
	const rooms = useMemo(() => roomsInSection(subscriptions, header), [subscriptions, header]);
	const sections = useMemo<CategorySection[]>(
		() =>
			subscriptions
				.filter(room => room.separator)
				.map(separator => ({ header: separator.rid, title: separator.name ?? i18n.t(separator.rid) })),
		[subscriptions]
	);
	return { rooms, sections, loading };
};
