import { useEffect, useState } from 'react';

import { type TSubscriptionModel } from '../../definitions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

export const useSubscription = (rid?: string): TSubscriptionModel | undefined => {
	'use memo';

	const [subscription, setSubscription] = useState<TSubscriptionModel>();
	useEffect(() => {
		const load = async () => {
			if (!rid) return;
			const result = await getSubscriptionByRoomId(rid);
			if (result) {
				setSubscription(result);
			}
		};
		load();

		return () => {
			setSubscription(undefined);
		};
	}, [rid]);

	return subscription;
};
