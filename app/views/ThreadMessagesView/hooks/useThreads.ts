import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { map } from 'rxjs/operators';

import { type TSubscriptionModel } from '~/definitions';
import database from '~/lib/database';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { sanitizeLikeString } from '~/lib/database/utils';
import { useObservable } from '~/lib/hooks/useObservable';
import log from '~/lib/methods/helpers/log';
import { getSyncThreadsList, getThreadsList } from '~/lib/services/restApi';
import updateThreads from '../methods/updateThreads';
import { toThreadRow, type TThreadRow } from '../types';

const API_FETCH_COUNT = 50;

interface IUseThreads {
	rid: string;
	subscription: TSubscriptionModel | null;
	searchText: string;
}

const observeThreads = (rid: string, searchText: string) => {
	const clauses = [Q.where('rid', rid), Q.sortBy('tlm', Q.desc)];
	const trimmedSearchText = searchText.trim();
	if (trimmedSearchText) {
		clauses.push(Q.where('msg', Q.like(`%${sanitizeLikeString(trimmedSearchText)}%`)));
	}
	return database.active
		.get('threads')
		.query(...clauses)
		.observeWithColumns(['_updated_at'])
		.pipe(map(threads => threads.map(toThreadRow)));
};

export const useThreads = ({ rid, subscription, searchText }: IUseThreads) => {
	const storedThreads = useObservable(
		useMemo(() => (subscription ? observeThreads(rid, searchText) : undefined), [rid, searchText, subscription])
	);
	const [fetchedThreads, setFetchedThreads] = useState<TThreadRow[]>([]);
	const [loading, setLoading] = useState(true);
	const pagination = useRef({ offset: 0, end: false, inFlight: false });

	const canLoadMore = () => !pagination.current.end && !pagination.current.inFlight;

	const load = async (targetSubscription: TSubscriptionModel | null, lastThreadSync = new Date()) => {
		const page = pagination.current;
		page.inFlight = true;
		try {
			const result = await getThreadsList({ rid, count: API_FETCH_COUNT, offset: page.offset, text: searchText });
			if (result.success) {
				const builtThreads = await updateThreads({ subscription: targetSubscription, update: result.threads, lastThreadSync });
				if (!targetSubscription) {
					setFetchedThreads(previous => [...previous, ...builtThreads]);
				}
				page.end = result.count < API_FETCH_COUNT;
				page.offset += API_FETCH_COUNT;
			} else {
				page.end = true;
			}
		} catch (e) {
			log(e);
			page.end = true;
		}
		page.inFlight = false;
		setLoading(false);
	};

	const sync = async (syncedSubscription: TSubscriptionModel, updatedSince: Date) => {
		try {
			const result = await getSyncThreadsList({ rid, updatedSince: updatedSince.toISOString() });
			if (result.success && result.threads) {
				const { update, remove } = result.threads;
				await updateThreads({ subscription: syncedSubscription, update, remove, lastThreadSync: updatedSince });
			}
		} catch (e) {
			log(e);
		}
		setLoading(false);
	};

	const fetchInitialThreads = useEffectEvent((roomSubscription: TSubscriptionModel | null) => {
		if (roomSubscription?.lastThreadSync) {
			sync(roomSubscription, roomSubscription.lastThreadSync);
		} else {
			load(roomSubscription);
		}
	});

	useEffect(() => {
		getSubscriptionByRoomId(rid).then(fetchInitialThreads);
	}, [rid]);

	return {
		threads: subscription ? (storedThreads ?? []) : fetchedThreads,
		loading,
		loadMore: () => {
			if (canLoadMore()) {
				setLoading(true);
				load(subscription);
			}
		}
	};
};
