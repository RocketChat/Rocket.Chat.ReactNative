import { useLayoutEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { TAnyMessageModel, TThreadMessageModel, TThreadModel } from '../../../definitions';
import database from '../../../lib/database';
import { getThreadById } from '../../../lib/database/services/Thread';

export const useMessages = ({
	rid,
	tmid,
	showMessageInMainThread,
	serverVersion,
	count
}: {
	rid: string;
	tmid?: string;
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	count: number;
}): TAnyMessageModel[] => {
	const [messages, setMessages] = useState<TAnyMessageModel[]>([]);
	const thread = useRef<TThreadModel | null>(null);

	useLayoutEffect(() => {
		const fetchMessages = async () => {
			console.count('RoomViewList useEffect');
			console.log(rid, tmid, showMessageInMainThread, serverVersion, count);

			if (!rid) {
				return;
			}

			const db = database.active;
			let observable;
			if (tmid) {
				if (!thread.current) {
					thread.current = await getThreadById(tmid);
				}
				observable = db
					.get('thread_messages')
					.query(Q.where('rid', tmid), Q.experimentalSortBy('ts', Q.desc), Q.experimentalSkip(0), Q.experimentalTake(count))
					.observe();
			} else {
				const whereClause = [
					Q.where('rid', rid),
					Q.experimentalSortBy('ts', Q.desc),
					Q.experimentalSkip(0),
					Q.experimentalTake(count)
				] as (Q.WhereDescription | Q.Or)[];
				if (!showMessageInMainThread) {
					whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
				}
				observable = db
					.get('messages')
					.query(...whereClause)
					.observe();
			}

			const subscription = observable.subscribe(result => {
				const messages: TAnyMessageModel[] = result;
				if (tmid && thread.current) {
					messages.push(thread.current);
				}
				setMessages(messages);
			});

			return () => {
				subscription.unsubscribe();
			};
		};
		fetchMessages();
	}, [rid, tmid, showMessageInMainThread, serverVersion, count]);

	return messages;
};
