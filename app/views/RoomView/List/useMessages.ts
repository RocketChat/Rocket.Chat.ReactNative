import { useLayoutEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { TAnyMessageModel } from '../../../definitions';
import database from '../../../lib/database';

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

	useLayoutEffect(() => {
		console.count('RoomViewList useEffect');

		if (!rid) {
			return;
		}

		const db = database.active;
		if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(count)
			] as (Q.WhereDescription | Q.Or)[];
			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			const observable = db
				.get('messages')
				.query(...whereClause)
				.observe();

			const subscription = observable.subscribe(data => {
				setMessages(data);
			});

			return () => {
				subscription.unsubscribe();
			};
		}
	}, [rid, tmid, showMessageInMainThread, serverVersion, count]);

	return messages;
};
