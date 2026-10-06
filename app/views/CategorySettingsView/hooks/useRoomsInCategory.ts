import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';

import database from '~/lib/database';
import log from '~/lib/methods/helpers/log';
import { toCategoryRoom } from '~/views/CreateCategoryView/hooks/useCategoryRoomCandidates';
import { type ICategoryRoom } from '~/views/CreateCategoryView/types';

export const useRoomsInCategory = (categoryId: string) => {
	const [rooms, setRooms] = useState<ICategoryRoom[]>([]);

	useEffect(() => {
		const subscription = database.active
			.get('subscriptions')
			.query(Q.where('category', categoryId), Q.sortBy('room_updated_at', Q.desc))
			.observeWithColumns(['category'])
			.subscribe({
				next: subscriptions => setRooms(subscriptions.map(toCategoryRoom)),
				error: log
			});
		return () => subscription.unsubscribe();
	}, [categoryId]);

	return rooms;
};
