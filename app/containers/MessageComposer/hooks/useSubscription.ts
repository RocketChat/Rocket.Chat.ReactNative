import { useEffect, useState } from 'react';

import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { ISubscription } from '../../../definitions';

// TODO: Not reactive. Should we work on an official version?
export const useSubscription = (rid?: string) => {
	const [subscription, setSubscription] = useState<ISubscription>();
	useEffect(() => {
		const loadRoom = async () => {
			if (!rid) {
				return setSubscription(undefined);
			}
			const result = await getSubscriptionByRoomId(rid);
			if (result) {
				setSubscription(result);
			}
		};
		loadRoom();
	}, [rid]);

	return subscription;
};
