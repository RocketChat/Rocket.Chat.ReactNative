import { useEffect, useRef, useState } from 'react';
import { type Subscription } from 'rxjs';

import { type TSubscriptionModel } from '../../../definitions';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';

interface IUseSubscriptionProps {
	rid: string;
}

const useSubscription = ({ rid }: IUseSubscriptionProps) => {
	const subSubscription = useRef<Subscription | null>(null);

	const [subscription, setSubscription] = useState<TSubscriptionModel>({} as TSubscriptionModel);
	const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

	const initSubscription = async () => {
		try {
			const db = database.active;

			const subscription = await db.get('subscriptions').find(rid);
			const observable = subscription.observe();
			subSubscription.current = observable.subscribe(data => {
				setSubscription(data);
			});
			setSubscriptionLoaded(true);
		} catch (e) {
			setSubscriptionLoaded(true);
			log(e);
		}
	};

	const unsubscribe = () => {
		subSubscription.current?.unsubscribe();
	};

	useEffect(() => {
		initSubscription();

		return () => {
			unsubscribe();
		};
	}, []);

	return {
		subscription,
		subscriptionLoaded
	};
};

export default useSubscription;
