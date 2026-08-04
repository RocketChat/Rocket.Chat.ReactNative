import { useEffect, useState } from 'react';

import database from '../../../lib/database';
import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { type TSubscriptionModel } from '../../../definitions';
import { type IUseSubscriptionUnreadsResult } from '../definitions';

export function useSubscriptionUnreads(rid?: string, userId?: string): IUseSubscriptionUnreadsResult {
	const [tunread, setTunread] = useState<string[]>([]);
	const [tunreadUser, setTunreadUser] = useState<string[]>([]);
	const [tunreadGroup, setTunreadGroup] = useState<string[]>([]);
	const [isSelfDm, setIsSelfDm] = useState(false);
	const [subscription, setSubscription] = useState<TSubscriptionModel>();

	useEffect(() => {
		if (!rid) {
			return;
		}
		let unsubscribe: (() => void) | undefined;
		database.active
			.get('subscriptions')
			.find(rid)
			.then((subRecord: TSubscriptionModel) => {
				setSubscription(subRecord);
				const subscriptionRef = subRecord.observe().subscribe(sub => {
					setTunread(sub?.tunread ?? []);
					setTunreadUser(sub?.tunreadUser ?? []);
					setTunreadGroup(sub?.tunreadGroup ?? []);
					setIsSelfDm(sub?.t === 'd' && !!userId && getUidDirectMessage(sub) === userId);
				});
				unsubscribe = () => subscriptionRef.unsubscribe();
			})
			.catch(() => console.log("Can't find subscription to observe."));

		return () => unsubscribe?.();
	}, [rid, userId]);

	return { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription };
}
