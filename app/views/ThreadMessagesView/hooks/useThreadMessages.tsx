import { useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Observable, Subscription } from 'rxjs';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { ISearchThreadMessages } from '../definitions';
import { IMessage, IUser, TSubscriptionModel, TThreadModel } from '../../../definitions';
import { debounce } from '../../../lib/methods/helpers';
import { Services } from '../../../lib/services';
import { sanitizeLikeString } from '../../../lib/database/utils';
import log from '../../../lib/methods/helpers/log';
import protectedFunction from '../../../lib/methods/helpers/protectedFunction';
import buildMessage from '../../../lib/methods/helpers/buildMessage';
import database from '../../../lib/database';
import getFilteredThreads from '../utils/getFilteredThreads';
import { Filter } from '../filters';

const API_FETCH_COUNT = 50;

interface IUseThreadMessagesProps {
	user: IUser;
	rid: string;
	messagesObservable: Observable<TThreadModel[]>;
	currentFilter: Filter;
	search: ISearchThreadMessages;
}

const useThreadMessages = ({ user, rid, search, currentFilter, messagesObservable }: IUseThreadMessagesProps) => {
	let subSubscription: Subscription;
	let messagesSubscription: Subscription;
	const [loading, setLoading] = useState(false);
	const [end, setEnd] = useState(false);
	const [messages, setMessages] = useState<TThreadModel[]>([]);
	const [displayingThreads, setDisplayingThreads] = useState<TThreadModel[]>([]);
	const [subscription, setSubscription] = useState<TSubscriptionModel>({} as TSubscriptionModel);
	const [offset, setOffset] = useState(0);

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

	const initSubscription = async () => {
		try {
			const db = database.active;

			// subscription query
			const subscription = await db.get('subscriptions').find(rid);
			const observable = subscription.observe();
			subSubscription = observable.subscribe(data => {
				setSubscription(data);
			});

			subscribeMessages({ subscription });
		} catch (e) {
			log(e);
		}
	};

	const subscribeMessages = ({ subscription, searchText }: { subscription?: TSubscriptionModel; searchText?: string }) => {
		try {
			const db = database.active;

			if (messagesSubscription && messagesSubscription.unsubscribe) {
				messagesSubscription.unsubscribe();
			}

			const whereClause = [Q.where('rid', rid), Q.sortBy('tlm', Q.desc)];

			if (searchText?.trim()) {
				whereClause.push(Q.where('msg', Q.like(`%${sanitizeLikeString(searchText.trim())}%`)));
			}

			messagesObservable = db
				.get('threads')
				.query(...whereClause)
				.observeWithColumns(['_updated_at']);

			messagesSubscription = messagesObservable.subscribe(messages => {
				const displayingThreads = getFilteredThreads(user, messages, subscription, currentFilter);
				setMessages(messages);
				setDisplayingThreads(displayingThreads);
			});
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

	const unsubscribeMessages = () => {
		if (subSubscription) {
			subSubscription.unsubscribe();
		}
		if (messagesSubscription) {
			messagesSubscription.unsubscribe();
		}
	};

	return {
		subscription,
		messages,
		init,
		initSubscription,
		displayingThreads,
		loadMore: load,
		loading,
		setDisplayingThreads,
		subscribeMessages,
		unsubscribeMessages
	};
};

export default useThreadMessages;
