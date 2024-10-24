import React, { useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';

import { IUser, TSubscriptionModel } from '../../../definitions';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';
import { Filter } from '../filters';

interface IUseSubscriptionProps {
	user: IUser;
	rid: string;
	currentFilter: Filter;
	messagesSubscription: React.MutableRefObject<Subscription | null>;
}

const useSubscription = ({ rid, currentFilter, messagesSubscription }: IUseSubscriptionProps) => {
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
		if (messagesSubscription) {
			messagesSubscription.current?.unsubscribe();
		}
	};

	useEffect(() => {
		initSubscription();

		return () => {
			unsubscribeMessages();
		};
	}, [currentFilter]);

	return {
		subscription
	};
};

export default useSubscription;
