import { useState, useEffect, useRef } from 'react';
import { dequal } from 'dequal';
import { Subscription } from 'rxjs';
import { orderBy } from 'lodash';

import { TSubscriptionModel } from '../../definitions';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

export const useSubscriptionRoles = (rid?: string): TSubscriptionModel['roles'] => {
	const [subscriptionRoles, setSubscriptionRoles] = useState<TSubscriptionModel['roles']>([]);
	const subscriptionRoleRef = useRef<TSubscriptionModel['roles']>([]);

	useEffect(() => {
		if (!rid) {
			return;
		}
		let subSubscription: Subscription;
		getSubscriptionByRoomId(rid).then(sub => {
			if (!sub) {
				return;
			}
			const observable = sub.observe();
			subSubscription = observable.subscribe(s => {
				const newRoles = orderBy(s.roles);
				if (!dequal(subscriptionRoleRef.current, newRoles)) {
					subscriptionRoleRef.current = newRoles;
					setSubscriptionRoles(newRoles);
				}
			});
		});

		return () => {
			if (subSubscription && subSubscription?.unsubscribe) {
				subSubscription.unsubscribe();
			}
		};
	}, [rid]);

	return subscriptionRoles;
};
