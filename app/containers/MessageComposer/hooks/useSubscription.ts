import { useEffect, useState } from 'react';

import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { ISubscription } from '../../../definitions';

// TODO: Not reactive. Should we work on an official version?
// Please let me know if you'd like me to remove the above comment?

export const useSubscription = (rid?: string) => {
	const [subscription, setSubscription] = useState<ISubscription>();

	useEffect(() => {
		// eslint-disable-next-line no-undef
		let interval: NodeJS.Timeout;
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
		return () => clearInterval(interval);
	}, [rid]);

	return subscription;
};
