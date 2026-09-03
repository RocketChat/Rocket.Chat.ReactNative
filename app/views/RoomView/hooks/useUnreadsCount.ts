import { useMemo } from 'react';
import { Q } from '@nozbe/watermelondb';

import database from '../../../lib/database';
import { isIOS } from '../../../lib/methods/helpers';
import { useObservable } from '../../../lib/hooks/useObservable';
import { type TSubscriptionModel } from '../../../definitions';

export function useUnreadsCount(rid?: string): number | null {
	const observable = useMemo(
		() =>
			isIOS && rid
				? database.active
						.get<TSubscriptionModel>('subscriptions')
						.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(rid)))
						.observeWithColumns(['unread'])
				: undefined,
		[rid]
	);
	const rooms = useObservable(observable);

	if (!rooms) {
		return null;
	}
	return rooms.reduce(
		(unreadCount, item) => (item.unread > 0 && !item.hideUnreadStatus ? unreadCount + item.unread : unreadCount),
		0
	);
}
