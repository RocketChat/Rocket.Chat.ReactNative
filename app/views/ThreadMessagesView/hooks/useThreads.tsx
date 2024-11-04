import React, { useLayoutEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Subscription, Observable } from 'rxjs';
import { useDebouncedCallback } from 'use-debounce';

import { Services } from '../../../lib/services';
import { TThreadModel } from '../../../definitions';
import { sanitizeLikeString } from '../../../lib/database/utils';
import { Filter } from '../filters';
import { ISearchThreadMessages } from '../definitions';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';
import updateThreads from '../methods/updateThreads';

interface IUseThreadsProps {
	search: ISearchThreadMessages;
	currentFilter: Filter;
	subscription: any;
	threadsSubscription: React.MutableRefObject<Subscription | null>;
	rid: string;
}

const API_FETCH_COUNT = 50;

const useThreads = ({ search, subscription, rid, threadsSubscription }: IUseThreadsProps) => {
	const threadsObservable = useRef<Observable<TThreadModel[]> | null>(null);
	const [loading, setLoading] = useState(false);
	const [end, setEnd] = useState(false);
	const [threads, setThreads] = useState<TThreadModel[]>([]);
	const [offset, setOffset] = useState(0);

	const init = () => {
		if (!subscription) {
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
			const result = await Services.getThreadsList({
				rid,
				count: API_FETCH_COUNT,
				offset,
				text: search.searchText
			});

			if (result.success) {
				updateThreads({ subscription, update: result.threads, lastThreadSync: lastThreadSync ?? new Date() });
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
			const result = await Services.getSyncThreadsList({
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
		try {
			const db = database.active;
			if (threadsSubscription && threadsSubscription?.current?.unsubscribe) {
				threadsSubscription?.current?.unsubscribe();
			}

			const whereClause = [Q.where('rid', rid), Q.sortBy('tlm', Q.desc)];
			if (searchText?.trim()) {
				whereClause.push(Q.where('msg', Q.like(`%${sanitizeLikeString(searchText.trim())}%`)));
			}

			threadsObservable.current = db
				.get('threads')
				.query(...whereClause)
				.observeWithColumns(['_updated_at']);

			threadsSubscription.current = threadsObservable.current.subscribe((threads: TThreadModel[]) => {
				setThreads(threads);
			});
		} catch (e) {
			log(e);
		}
	};

	useLayoutEffect(() => {
		init();
		handleThreadsSubscription({});
	}, [subscription]);

	return {
		loading,
		loadMore,
		threads,
		handleThreadsSubscription
	};
};

export default useThreads;
