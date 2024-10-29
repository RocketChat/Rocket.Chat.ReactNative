import React, { useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';

import { IUser, TSubscriptionModel } from '../../../definitions';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';

interface IUseSubscriptionProps {
	user: IUser;
	rid: string;
	threadsSubscription: React.MutableRefObject<Subscription | null>;
}

const useSubscription = ({ rid, threadsSubscription }: IUseSubscriptionProps) => {
	const subSubscription = useRef<any | null>(null);

	const [subscription, setSubscription] = useState<TSubscriptionModel>({} as TSubscriptionModel);

	const initSubscription = async () => {
		try {
			const db = database.active;

			// subscription query
			const subscription = await db.get('subscriptions').find(rid);
			const observable = subscription.observe();
			subSubscription.current = observable.subscribe(data => {
				setSubscription(data);
			});
		} catch (e) {
			log(e);
		}
	};

	const unsubscribeMessages = () => {
		if (subSubscription) {
			subSubscription.current?.unsubscribe();
		}
		if (threadsSubscription) {
			threadsSubscription.current?.unsubscribe();
		}
	};

	useEffect(() => {
		initSubscription();

		return () => {
			unsubscribeMessages();
		};
	}, []);

	return {
		subscription
	};
};

export default useSubscription;
