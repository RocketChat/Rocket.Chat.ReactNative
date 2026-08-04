import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { isIOS } from '../../../lib/methods/helpers';
import { type TSubscriptionModel } from '../../../definitions';

export function useUnreadsCount(rid?: string): number | null {
	const [unreadsCount, setUnreadsCount] = useState<number | null>(null);

	useEffect(() => {
		if (!isIOS || !rid) {
			return;
		}
		const observable = database.active
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(rid)))
			.observeWithColumns(['unread']);

		const subscription = observable.subscribe((rooms: TSubscriptionModel[]) => {
			const nextUnreadsCount = rooms.reduce(
				(unreadCount, item) => (item.unread > 0 && !item.hideUnreadStatus ? unreadCount + item.unread : unreadCount),
				0
			);
			setUnreadsCount(nextUnreadsCount);
		});

		return () => subscription.unsubscribe();
	}, [rid]);

	return unreadsCount;
}
