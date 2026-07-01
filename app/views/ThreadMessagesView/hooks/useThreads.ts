import { useEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { type Subscription } from 'rxjs';
import { useDebouncedCallback } from 'use-debounce';

import { getSyncThreadsList, getThreadsList } from '../../../lib/services/restApi';
import { type TSubscriptionModel, type TThreadModel } from '../../../definitions';
import { sanitizeLikeString } from '../../../lib/database/utils';
import { type ISearchThreadMessages } from '../definitions';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';
import updateThreads from '../methods/updateThreads';

interface IUseThreadsProps {
	search: ISearchThreadMessages;
	subscription: TSubscriptionModel;
	subscriptionLoaded: boolean;
	rid: string;
}

const API_FETCH_COUNT = 50;

const useThreads = ({ search, subscription, subscriptionLoaded, rid }: IUseThreadsProps) => {
	const threadsSubscription = useRef<Subscription | null>(null);
	const didInit = useRef(false);
	const [loading, setLoading] = useState(false);
	const [end, setEnd] = useState(false);
	const [threads, setThreads] = useState<TThreadModel[]>([]);
	const [offset, setOffset] = useState(0);

	const init = () => {
		if (!subscription._id) {
			return load();
		}
		try {
			if (subscription.lastThreadSync) {
				sync(subscription.lastThreadSync);
			} else {
				load();
			}
		} catch (e) {
			log(e);
		}
	};

	const load = useDebouncedCallback(async (lastThreadSync?: Date) => {
		if (end || loading) {
			return;
		}
		setLoading(true);

		try {
			const result = await getThreadsList({
				rid,
				count: API_FETCH_COUNT,
				offset,
				text: search.searchText
			});

			if (result.success) {
				const built = await updateThreads({ subscription, update: result.threads, lastThreadSync: lastThreadSync ?? new Date() });
				if (!subscription._id && built) {
					setThreads(prev => [...prev, ...(built as TThreadModel[])]);
				}
				setLoading(false);
				setEnd(result.count < API_FETCH_COUNT);
				setOffset(offset + API_FETCH_COUNT);
			}
		} catch (e) {
			log(e);
			setLoading(false);
			setEnd(true);
		}
	}, 300);

	const loadMore = () => load();

	const sync = async (updatedSince: Date) => {
		setLoading(true);
		try {
			const result = await getSyncThreadsList({
				rid,
				updatedSince: updatedSince.toISOString()
			});
			if (result.success && result.threads) {
				const { update, remove } = result.threads;
				updateThreads({ subscription, update, remove, lastThreadSync: updatedSince });
			}
			setLoading(false);
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	const handleThreadsSubscription = ({ searchText }: { searchText?: string }) => {
		if (!subscription._id) {
			return;
		}
		try {
			const db = database.active;
			threadsSubscription.current?.unsubscribe();

			const whereClause = [Q.where('rid', rid), Q.sortBy('tlm', Q.desc)];
			if (searchText?.trim()) {
				whereClause.push(Q.where('msg', Q.like(`%${sanitizeLikeString(searchText.trim())}%`)));
			}

			const threadsObservable = db
				.get('threads')
				.query(...whereClause)
				.observeWithColumns(['_updated_at']);

			threadsSubscription.current = threadsObservable.subscribe((threads: TThreadModel[]) => {
				setThreads(threads);
			});
		} catch (e) {
			log(e);
		}
	};

	useEffect(() => {
		if (!subscriptionLoaded || didInit.current) {
			return;
		}
		didInit.current = true;
		init();
		handleThreadsSubscription({});
	}, [subscriptionLoaded]);

	useEffect(() => () => threadsSubscription.current?.unsubscribe(), []);

	return {
		loading,
		loadMore,
		threads,
		handleThreadsSubscription
	};
};

export default useThreads;
