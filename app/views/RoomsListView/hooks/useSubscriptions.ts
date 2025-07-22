import { useEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Subscription } from 'rxjs';

import { SortBy } from '../../../lib/constants';
import database from '../../../lib/database';
import { useAppSelector } from '../../../lib/hooks';
import { TSubscriptionModel } from '../../../definitions';

export const useSubscriptions = ({ isGrouping, sortBy }: { isGrouping: boolean; sortBy: SortBy }) => {
	console.count(`${useSubscriptions.name}.render calls`);
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const subscriptionRef = useRef<Subscription>(null);
	const [subscriptions, setSubscriptions] = useState<TSubscriptionModel[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const getSubscriptions = async () => {
			setLoading(true);
			const db = database.active;
			const whereClause = [Q.where('archived', false), Q.where('open', true)] as (Q.WhereDescription | Q.SortBy)[];

			if (sortBy === SortBy.Alphabetical) {
				whereClause.push(Q.sortBy(`${useRealName ? 'fname' : 'name'}`, Q.asc));
			} else {
				whereClause.push(Q.sortBy('room_updated_at', Q.desc));
			}

			const observeWithColumns = isGrouping ? ['alert', 'on_hold', 'f'] : ['on_hold'];

			const observable = await db
				.get('subscriptions')
				.query(...whereClause)
				.observeWithColumns(observeWithColumns);

			subscriptionRef.current = observable.subscribe(data => {
				setSubscriptions(data);
				setLoading(false);
			});
		};

		getSubscriptions();

		return () => {
			console.countReset(`${useSubscriptions.name}.render calls`);
			subscriptionRef.current?.unsubscribe();
		};
	}, [isGrouping, sortBy, useRealName]);

	return {
		subscriptions,
		loading
	};
};
