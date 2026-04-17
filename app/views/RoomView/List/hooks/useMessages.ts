import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { type Subscription } from 'rxjs';
import { useDispatch } from 'react-redux';

import { type RoomType, type TAnyMessageModel } from '../../../../definitions';
import database from '../../../../lib/database';
import { getMessageById } from '../../../../lib/database/services/Message';
import { getThreadById } from '../../../../lib/database/services/Thread';
import { compareServerVersion, useDebounce } from '../../../../lib/methods/helpers';
import { readThreads } from '../../../../lib/services/restApi';
import { MESSAGE_TYPE_ANY_LOAD, type MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import { QUERY_SIZE } from '../constants';
import { buildVisibleSystemTypesClause } from './buildVisibleSystemTypesClause';
import { roomHistoryRequest } from '../../../../actions/room';

export const useMessages = ({
	rid,
	tmid,
	showMessageInMainThread,
	serverVersion,
	hideSystemMessages,
	t
}: {
	rid: string;
	tmid?: string;
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	hideSystemMessages: string[];
	t: RoomType;
}) => {
	const [rawMessages, setRawMessages] = useState<TAnyMessageModel[]>([]);
	const thread = useRef<TAnyMessageModel | null>(null);
	const count = useRef(0);
	const subscription = useRef<Subscription | null>(null);
	const messagesIds = useRef<string[]>([]);
	const lastDispatchedLoaderId = useRef<string | null>(null);
	const dispatch = useDispatch();

	const fetchMessages = useCallback(async () => {
		unsubscribe();
		count.current += QUERY_SIZE;

		if (!rid) {
			return;
		}

		const db = database.active;

		// Apply the filter to the DB query. This guarantees Q.take() grabs
		// exactly enough messages to keep pagination from breaking.
		const visibleSystemClause = hideSystemMessages.length ? buildVisibleSystemTypesClause(hideSystemMessages) : null;

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
				.query(
					Q.where('rid', tmid),
					...(visibleSystemClause ? [visibleSystemClause] : []),
					Q.sortBy('ts', Q.desc),
					Q.skip(0),
					Q.take(count.current)
				)
				.observe();
		} else {
			const whereClause: Q.Clause[] = [
				Q.where('rid', rid),
				...(visibleSystemClause ? [visibleSystemClause] : []),
				Q.sortBy('ts', Q.desc),
				Q.skip(0),
				Q.take(count.current)
			];
			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			observable = db
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		subscription.current = observable.subscribe(result => {
			const newMessages: TAnyMessageModel[] = [...result];

			if (tmid && thread.current) {
				newMessages.push(thread.current);
			}

			readThread();
			setRawMessages(newMessages);
		});
	}, [rid, tmid, showMessageInMainThread, hideSystemMessages]); // hideSystemMessages must be here so the DB re-queries for proper pagination

	const readThread = useDebounce(async () => {
		if (tmid) {
			try {
				await readThreads(tmid);
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
	}, [fetchMessages]);

	const unsubscribe = () => {
		subscription.current?.unsubscribe();
	};

	const visibleMessages = useMemo(() => {
		const filtered =
			!hideSystemMessages || hideSystemMessages.length === 0
				? rawMessages
				: rawMessages.filter(m => !m.t || !hideSystemMessages.includes(m.t));

		// Derive IDs in the same memo so the ref is never out of sync
		// with the visible list, even under concurrent rendering.
		messagesIds.current = filtered.map(m => m.id);

		return filtered;
	}, [rawMessages, hideSystemMessages]);

	/**
	 * Since 3.16.0 server version, the backend don't response with messages if
	 * hide system message is enabled
	 */
	useEffect(() => {
		if (!compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0') || !hideSystemMessages.length) {
			return;
		}

		const loaderId = visibleMessages.find(m => m.t && MESSAGE_TYPE_ANY_LOAD.includes(m.t as MessageTypeLoad))?.id;

		// Only dispatch if a loader exists AND it's a different one
		// from the last dispatch — prevents hammering on every message update.
		if (loaderId && loaderId !== lastDispatchedLoaderId.current) {
			lastDispatchedLoaderId.current = loaderId;
			dispatch(roomHistoryRequest({ rid, t, loaderId }));
		}
	}, [serverVersion, rid, t, hideSystemMessages, visibleMessages, dispatch]);

	useEffect(() => {
		lastDispatchedLoaderId.current = null;
	}, [rid]);

	return [visibleMessages, messagesIds, fetchMessages] as const;
};
