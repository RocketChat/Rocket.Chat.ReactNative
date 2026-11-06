import { useEffect, useState } from 'react';
import { type Subscription } from 'rxjs';

import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from '../methods/helpers/log';

export const useRoomUnread = (rid?: string): number => {
	const [unread, setUnread] = useState(0);

	useEffect(() => {
		if (!rid) {
			return;
		}
		let active = true;
		let observing: Subscription | undefined;

		getSubscriptionByRoomId(rid)
			.then(subscription => {
				if (active && subscription) {
					observing = subscription.observe().subscribe(({ unread: count }) => setUnread(count ?? 0));
				}
			})
			.catch(log);

		return () => {
			active = false;
			observing?.unsubscribe();
		};
	}, [rid]);

	return rid ? unread : 0;
};
