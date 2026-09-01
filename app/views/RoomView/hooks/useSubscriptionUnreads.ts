import { useEffect, useState } from 'react';

import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
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
		getSubscriptionByRoomId(rid).then(subRecord => {
			if (!subRecord) {
				return;
			}
			setSubscription(subRecord);
			const subscription = subRecord.observe().subscribe(sub => {
				setTunread(sub?.tunread ?? []);
				setTunreadUser(sub?.tunreadUser ?? []);
				setTunreadGroup(sub?.tunreadGroup ?? []);
				setIsSelfDm(sub?.t === 'd' && !!userId && getUidDirectMessage(sub) === userId);
			});
			unsubscribe = () => subscription.unsubscribe();
		});

		return () => unsubscribe?.();
	}, [rid, userId]);

	return { tunread, tunreadUser, tunreadGroup, isSelfDm, subscription };
}
