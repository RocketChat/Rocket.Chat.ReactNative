import { useEffect, useState } from 'react';

import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { ISubscription } from '../../../definitions';

// TODO: Not reactive. Should we work on an official version?

export const useSubscription = (rid?: string) => {
	const [subscription, setSubscription] = useState<ISubscription>();

	useEffect(() => {
		let interval: ReturnType<typeof setTimeout> | null;
		const loadRoom = async () => {
			if (!rid) {
				setSubscription(undefined);
				return;
			}
			const result = await getSubscriptionByRoomId(rid);
			if (result) {
				setSubscription(result);
			}
		};

		loadRoom();
		if (rid) {
			interval = setInterval(loadRoom, 50);
		}
		return () => {
			if (interval !== null) {
				clearInterval(interval);
			}
		};
	}, [rid]);

	return subscription;
};
