import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Subscription } from 'rxjs';

import { TAnyMessageModel } from '../../../../definitions';
import database from '../../../../lib/database';
import { getMessageById } from '../../../../lib/database/services/Message';
import { getThreadById } from '../../../../lib/database/services/Thread';
import { animateNextTransition, compareServerVersion, isIOS, useDebounce } from '../../../../lib/methods/helpers';
import { Services } from '../../../../lib/services';
import { QUERY_SIZE } from '../constants';

export const useMessages = ({
	rid,
	tmid,
	showMessageInMainThread,
	serverVersion,
	hideSystemMessages
}: {
	rid: string;
	tmid?: string;
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	hideSystemMessages: string[];
}) => {
	const [messages, setMessages] = useState<TAnyMessageModel[]>([]);
	const thread = useRef<TAnyMessageModel | null>(null);
	const count = useRef(0);
	const subscription = useRef<Subscription | null>(null);
	const messagesIds = useRef<string[]>([]);

	const fetchMessages = useCallback(async () => {
		unsubscribe();
		count.current += QUERY_SIZE;

		if (!rid) {
			return;
		}

		const db = database.active;
		let observable;
		if (tmid) {
			// If the thread doesn't exist yet, we fetch it from messages, but trying to get it from threads when possible.
			// As soon as we have it from threads table, we use it from cache only and never query again.
			if (!thread.current || thread.current.collection.table !== 'threads') {
				thread.current = await getThreadById(tmid);
				if (!thread.current) {
					thread.current = await getMessageById(tmid);
				}
			}
			observable = db
				.get('thread_messages')
				.query(Q.where('rid', tmid), Q.sortBy('ts', Q.desc), Q.skip(0), Q.take(count.current))
				.observe();
		} else {
			const whereClause = [Q.where('rid', rid), Q.sortBy('ts', Q.desc), Q.skip(0), Q.take(count.current)] as (
				| Q.WhereDescription
				| Q.Or
			)[];
			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			observable = db
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		subscription.current = observable.subscribe(result => {
			let newMessages: TAnyMessageModel[] = result;
			if (tmid && thread.current) {
				newMessages.push(thread.current);
			}

			/**
			 * Since 3.16.0 server version, the backend don't response with messages if
			 * hide system message is enabled
			 */
			if (compareServerVersion(serverVersion, 'lowerThan', '3.16.0') || hideSystemMessages.length) {
				newMessages = newMessages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));
			}

			readThread();
			if (isIOS) {
				animateNextTransition();
			}
			setMessages(newMessages);
			messagesIds.current = newMessages.map(m => m.id);
		});
	}, [rid, tmid, showMessageInMainThread, serverVersion, hideSystemMessages]);

	const readThread = useDebounce(async () => {
		if (tmid) {
			try {
				await Services.readThreads(tmid);
			} catch {
				// Do nothing
			}
		}
	}, 1000);

	useLayoutEffect(() => {
		fetchMessages();

		return () => {
			unsubscribe();
		};
	}, [rid, tmid, showMessageInMainThread, serverVersion, hideSystemMessages, fetchMessages]);

	const unsubscribe = () => {
		subscription.current?.unsubscribe();
	};

	return [messages, messagesIds, fetchMessages] as const;
};
