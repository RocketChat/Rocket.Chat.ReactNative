import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { ISubscription } from '../../definitions';

type TResult = ISubscription | null;

export const useRoom = (rid: string): TResult => {
	const [room, setRoom] = useState<TResult>(null);

	useEffect(() => {
		let subSubscription: Subscription;
		getSubscriptionByRoomId(rid).then(sub => {
			if (!sub) {
				return;
			}
			const observable = sub.observe();
			subSubscription = observable.subscribe(s => {
				setRoom(s.asPlain());
			});
		});

		return () => {
			if (subSubscription && subSubscription?.unsubscribe) {
				subSubscription.unsubscribe();
			}
		};
	}, []);

	return room;
};
