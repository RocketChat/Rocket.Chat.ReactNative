import { useEffect, useState } from 'react';

import { type TSubscriptionModel } from '../../definitions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

export const useSubscription = (rid?: string): TSubscriptionModel | undefined => {
	'use memo';

	const [subscription, setSubscription] = useState<TSubscriptionModel>();
	useEffect(() => {
		let isActive = true;

		const load = async () => {
			if (!rid) return;
			const result = await getSubscriptionByRoomId(rid);
			if (isActive) {
				setSubscription(result ?? undefined);
			}
		};
		load();

		return () => {
			isActive = false;
		};
	}, [rid]);

	return subscription;
};
