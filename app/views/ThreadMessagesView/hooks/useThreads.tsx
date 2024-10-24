import React, { useLayoutEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Subscription } from 'rxjs';
import { Services } from '../../../lib/services';

import { TThreadModel } from '../../../definitions';
import { sanitizeLikeString } from '../../../lib/database/utils';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';
import { Filter } from '../filters';
import { useDebouncedCallback } from 'use-debounce';
import { ISearchThreadMessages } from '../definitions';
import updateThreads from '../methods/updateThreads';

interface IUseSubscriptionProps {
	search: ISearchThreadMessages;
	currentFilter: Filter;
	subscription: any;
	messagesSubscription: React.MutableRefObject<Subscription | null>;
	messagesObservable: any;
	rid: string;
}

const API_FETCH_COUNT = 50;

const useThreads = ({ search, subscription, rid, messagesSubscription, messagesObservable }: IUseSubscriptionProps) => {
	const [loading, setLoading] = useState(false);
	const [end, setEnd] = useState(false);
	const [messages, setMessages] = useState<TThreadModel[]>([]);
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
				if (!subscription._id) {
					setMessages([...messages, ...result.threads] as TThreadModel[]);
					setLoading(false);
					setEnd(result.count < API_FETCH_COUNT);
					setOffset(offset + API_FETCH_COUNT);
					return;
				}

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

	const subscribeMessages = ({ searchText }: { searchText?: string }) => {
		try {
			const db = database.active;
			if (messagesSubscription && messagesSubscription?.current?.unsubscribe) {
				messagesSubscription?.current?.unsubscribe();
			}

			const whereClause = [Q.where('rid', rid), Q.sortBy('tlm', Q.desc)];
			if (searchText?.trim()) {
				whereClause.push(Q.where('msg', Q.like(`%${sanitizeLikeString(searchText.trim())}%`)));
			}

			messagesObservable = db
				.get('threads')
				.query(...whereClause)
				.observeWithColumns(['_updated_at']);

			messagesSubscription.current = messagesObservable.subscribe((messages: TThreadModel[]) => {
				setMessages(messages);
			});
		} catch (e) {
			log(e);
		}
	};

	useLayoutEffect(() => {
		init();
		subscribeMessages({});
	}, []);

	return {
		loading,
		loadMore: load as () => Promise<void>,
		messages
	};
};

export default useThreads;
