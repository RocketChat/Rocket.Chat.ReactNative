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
	hideSystemMessages,
	serverVersion,
	t
}: {
	rid: string;
	tmid?: string;
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	hideSystemMessages: string[];
	t: RoomType;
}) => {
	// 1. Store RAW messages directly from the database
	const [rawMessages, setRawMessages] = useState<TAnyMessageModel[]>([]);
	const thread = useRef<TAnyMessageModel | null>(null);
	const count = useRef(0);
	const subscription = useRef<Subscription | null>(null);
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

			// Push the thread parent. If it happens to be a hidden system message,
			// our useMemo down below will safely catch it and hide it from the UI.
			if (tmid && thread.current) {
				newMessages.push(thread.current);
			}

			readThread();
			setRawMessages(newMessages); // Set state with raw DB results
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
		if (!hideSystemMessages || hideSystemMessages.length === 0) {
			return rawMessages;
		}
		return rawMessages.filter(m => !m.t || !hideSystemMessages.includes(m.t));
	}, [rawMessages, hideSystemMessages]);

	//
	// * When the server version is greater than or equal to 3.16.0, we need to dispatch a roomHistoryRequest to load the next chunk of messages.
	// * This is because the server will not return the next chunk of messages if the user has hidden system messages.
	// * @see https://github.com/RocketChat/Rocket.Chat/pull/28406
	// */
	useEffect(() => {
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0')) {
			const loaderId = visibleMessages.find(m => m.t && MESSAGE_TYPE_ANY_LOAD.includes(m.t as MessageTypeLoad))?.id;
			if (hideSystemMessages && loaderId) {
				dispatch(roomHistoryRequest({ rid, t, loaderId }));
			}
		}
	}, [hideSystemMessages, visibleMessages]);
	// 2. Reactively filter in-memory. This mimics the Web's Zustand behavior
	// and updates the UI instantly before the DB query even finishes rebuilding.

	// 3. Reactively compute IDs based on the currently visible messages
	const visibleMessagesIds = useMemo(() => visibleMessages.map(m => m.id), [visibleMessages]);

	return [visibleMessages, visibleMessagesIds, fetchMessages] as const;
};
