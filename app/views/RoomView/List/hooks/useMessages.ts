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
import { MAX_AUTO_LOADS, QUERY_SIZE } from '../constants';
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
	const autoLoadCount = useRef(0);
	const dispatch = useDispatch();

	const unsubscribe = useCallback(() => {
		subscription.current?.unsubscribe();
	}, []);

	const readThread = useDebounce(async () => {
		if (tmid) {
			try {
				await readThreads(tmid);
			} catch {
				// Do nothing
			}
		}
	}, 1000);

	const fetchMessages = useCallback(async () => {
		unsubscribe();
		count.current += QUERY_SIZE;

		if (!rid) {
			return;
		}

		const db = database.active;
		// hideSystemMessages applied here so Q.take() counts only visible rows
		const visibleSystemClause = buildVisibleSystemTypesClause(hideSystemMessages);

		let observable;
		if (tmid) {
			// Prefer threads table; fall back to messages while thread record isn't available yet
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
		// eslint-disable-next-line react-hooks/exhaustive-deps -- readThread is omitted intentionally: useDebouncedCallback stores func in a ref so changes propagate without recreating fetchMessages; hideSystemMessages must stay so the DB re-queries for proper pagination
	}, [rid, tmid, showMessageInMainThread, hideSystemMessages, unsubscribe]);

	useLayoutEffect(() => {
		fetchMessages();
		return unsubscribe;
	}, [fetchMessages, unsubscribe]);

	const visibleMessages = useMemo(
		() =>
			!hideSystemMessages || hideSystemMessages.length === 0
				? rawMessages
				: rawMessages.filter(m => !m.t || !hideSystemMessages.includes(m.t)),
		[rawMessages, hideSystemMessages]
	);

	// Sync the IDs ref after render, outside the memo, to satisfy the react-hooks/refs rule
	// while still keeping the ref up to date before any paint (useLayoutEffect timing).
	useLayoutEffect(() => {
		messagesIds.current = visibleMessages.map(m => m.id);
	}, [visibleMessages]);

	useEffect(
		() => {
			// Snapshot the currently-visible loader into lastDispatchedLoaderId so the
			// auto-dispatch effect treats it as already-seen when it re-fires after the rid
			// change — rawMessages may still reflect the previous room until the new
			// subscription emits, and we must not dispatch with a stale loader.
			lastDispatchedLoaderId.current =
				visibleMessages.find(m => m.t && MESSAGE_TYPE_ANY_LOAD.includes(m.t as MessageTypeLoad))?.id ?? null;
			autoLoadCount.current = 0;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- visibleMessages intentionally omitted: stale read at rid-change is the desired behaviour
		[rid]
	);

	/**
	 * Since 3.16.0, the server omits system messages when hideSystemMessages is set.
	 * Auto-dispatch until visible content appears or the safety cap is reached.
	 */
	useEffect(() => {
		if (!compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0') || !hideSystemMessages.length) {
			return;
		}

		if (autoLoadCount.current >= MAX_AUTO_LOADS) {
			return;
		}

		const loaderId = visibleMessages.find(m => m.t && MESSAGE_TYPE_ANY_LOAD.includes(m.t as MessageTypeLoad))?.id;

		if (loaderId && loaderId !== lastDispatchedLoaderId.current) {
			lastDispatchedLoaderId.current = loaderId;
			autoLoadCount.current += 1;
			dispatch(roomHistoryRequest({ rid, t, loaderId }));
		}
	}, [serverVersion, rid, t, hideSystemMessages, visibleMessages, dispatch]);

	return [visibleMessages, messagesIds, fetchMessages] as const;
};
