import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { TSubscriptionModel } from '../../definitions';

interface IResult {
	encrypted: TSubscriptionModel['encrypted'];
	E2EKey: TSubscriptionModel['E2EKey'];
}

export const useEncrypted = (rid: string): IResult => {
	const [encrypted, setEncrypted] = useState(false);
	const [E2EKey, setE2EKey] = useState<IResult['E2EKey']>();

	useEffect(() => {
		let subSubscription: Subscription;
		getSubscriptionByRoomId(rid).then(sub => {
			if (!sub) {
				return;
			}
			const observable = sub.observe();
			subSubscription = observable.subscribe(s => {
				setE2EKey(s.E2EKey);
				setEncrypted(!!s.encrypted);
			});
		});

		return () => {
			if (subSubscription && subSubscription?.unsubscribe) {
				subSubscription.unsubscribe();
			}
		};
	}, []);

	return {
		encrypted,
		E2EKey
	};
};
