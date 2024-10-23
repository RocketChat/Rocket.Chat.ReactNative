import React, { useLayoutEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Observable, Subscription } from 'rxjs';

import { IUser, TSubscriptionModel, TThreadModel } from '../../../definitions';
import { sanitizeLikeString } from '../../../lib/database/utils';
import log from '../../../lib/methods/helpers/log';
import database from '../../../lib/database';
import getFilteredThreads from '../utils/getFilteredThreads';
import { Filter } from '../filters';

interface IUseSubscriptionProps {
	user: IUser;
	rid: string;
	messagesObservable: Observable<TThreadModel[]>;
	currentFilter: Filter;
	setMessages: React.Dispatch<React.SetStateAction<TThreadModel[]>>;
	setDisplayingThreads: React.Dispatch<React.SetStateAction<TThreadModel[]>>;
}

const useSubscription = ({
	user,
	rid,
	currentFilter,
	messagesObservable,
	setDisplayingThreads,
	setMessages
}: IUseSubscriptionProps) => {
	const subSubscription = useRef<any | null>(null);
	const messagesSubscription = useRef<Subscription | null>(null);

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

			subscribeMessages({ subscription });
		} catch (e) {
			log(e);
		}
	};

	const subscribeMessages = ({ subscription, searchText }: { subscription?: TSubscriptionModel; searchText?: string }) => {
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

			messagesSubscription.current = messagesObservable.subscribe(messages => {
				const displayingThreads = getFilteredThreads(user, messages, subscription, currentFilter);
				setMessages(messages);
				setDisplayingThreads(displayingThreads);
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

	useLayoutEffect(() => {
		initSubscription();

		return () => {
			unsubscribeMessages();
		};
	}, [currentFilter]);

	return {
		subscription,
		subscribeMessages
	};
};

export default useSubscription;
