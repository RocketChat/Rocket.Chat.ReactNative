import { Q } from '@nozbe/watermelondb';
import { useMemo } from 'react';
import { map } from 'rxjs';

import { type TSubscriptionModel } from '~/definitions';
import database from '~/lib/database';
import { useObservable } from '~/lib/hooks/useObservable';
import { type TRoomPlacement } from '../utils/roomCategory';

export const useRoomPlacement = (room: TSubscriptionModel): TRoomPlacement => {
	const { rid } = room;
	const placementObservable = useMemo(
		() =>
			database.active
				.get<TSubscriptionModel>('subscriptions')
				.query(Q.where('id', rid))
				.observeWithColumns(['category', 'f'])
				.pipe(map(([subscription]) => ({ rid, category: subscription?.category, f: subscription?.f }))),
		[rid]
	);
	return useObservable(placementObservable) ?? { rid, category: room.category, f: room.f };
};
