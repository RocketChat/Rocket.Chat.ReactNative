import { useState } from 'react';
import { Observable } from 'rxjs';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { ISearchThreadMessages } from '../definitions';
import { IMessage, IUser, TThreadModel } from '../../../definitions';
import { debounce } from '../../../lib/methods/helpers';
import { Services } from '../../../lib/services';
import log from '../../../lib/methods/helpers/log';
import protectedFunction from '../../../lib/methods/helpers/protectedFunction';
import buildMessage from '../../../lib/methods/helpers/buildMessage';
import database from '../../../lib/database';
import { Filter } from '../filters';
import useSubscription from './useSubscription';

const API_FETCH_COUNT = 50;

interface IUseThreadMessagesProps {
	user: IUser;
	rid: string;
	messagesObservable: Observable<TThreadModel[]>;
	currentFilter: Filter;
	search: ISearchThreadMessages;
}

const useThreadMessages = ({ user, rid, search, currentFilter, messagesObservable }: IUseThreadMessagesProps) => {
	const [loading, setLoading] = useState(false);
	const [end, setEnd] = useState(false);
	const [messages, setMessages] = useState<TThreadModel[]>([]);
	const [displayingThreads, setDisplayingThreads] = useState<TThreadModel[]>([]);
	const [offset, setOffset] = useState(0);

	const { subscription, subscribeMessages } = useSubscription({
		user,
		currentFilter,
		messagesObservable,
		rid,
		setDisplayingThreads,
		setMessages
	});

	const init = () => {
		if (!subscription) {
			return load();
		}
		try {
			const lastThreadSync = new Date();
			if (subscription.lastThreadSync) {
				sync(subscription.lastThreadSync);
			} else {
				load(lastThreadSync);
			}
		} catch (e) {
			log(e);
		}
	};

	const updateThreads = async ({
		update,
		remove,
		lastThreadSync
	}: {
		update: IMessage[];
		remove?: IMessage[];
		lastThreadSync: Date;
	}) => {
		// if there's no subscription, manage data on messages
		// note: sync will never be called without subscription

		try {
			const db = database.active;
			const threadsCollection = db.get('threads');
			const allThreadsRecords = await subscription.threads.fetch();
			let threadsToCreate: TThreadModel[] = [];
			let threadsToUpdate: (TThreadModel | null | undefined)[] = [];
			let threadsToDelete: TThreadModel[] = [];

			if (remove && remove.length) {
				threadsToDelete = allThreadsRecords.filter((i1: { id: string }) => remove.find(i2 => i1.id === i2._id));
				threadsToDelete = threadsToDelete.map(t => t.prepareDestroyPermanently());
			}

			if (update && update.length) {
				update = update.map(m => buildMessage(m)) as IMessage[];
				// filter threads
				threadsToCreate = update.filter(
					i1 => !allThreadsRecords.find((i2: { id: string }) => i1._id === i2.id)
				) as TThreadModel[];
				threadsToUpdate = allThreadsRecords.filter((i1: { id: string }) => update.find(i2 => i1.id === i2._id));
				threadsToCreate = threadsToCreate.map(thread =>
					threadsCollection.prepareCreate(
						protectedFunction((t: any) => {
							t._raw = sanitizedRaw({ id: thread._id }, threadsCollection.schema);
							t.subscription.set(subscription);
							Object.assign(t, thread);
						})
					)
				);
				threadsToUpdate = threadsToUpdate.map(thread => {
					const newThread = update.find(t => t._id === thread?.id);
					try {
						return thread?.prepareUpdate(
							protectedFunction((t: TThreadModel) => {
								Object.assign(t, newThread);
							})
						);
					} catch {
						return null;
					}
				});
			}

			await db.write(async () => {
				await db.batch(
					...threadsToCreate,
					...threadsToUpdate,
					...threadsToDelete,
					subscription.prepareUpdate(s => {
						s.lastThreadSync = lastThreadSync;
					})
				);
			});
		} catch (e) {
			log(e);
		}
	};

	const load = debounce(async (lastThreadSync: Date) => {
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
				updateThreads({ update: result.threads, lastThreadSync });
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
				updateThreads({ update, remove, lastThreadSync: updatedSince });
			}
			setLoading(false);
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	return {
		subscription,
		subscribeMessages,
		messages,
		init,
		displayingThreads,
		loadMore: load,
		loading,
		setDisplayingThreads
	};
};

export default useThreadMessages;
