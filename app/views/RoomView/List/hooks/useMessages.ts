import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { type Subscription } from 'rxjs';
import { useDispatch, useStore } from 'react-redux';

import { type IApplicationState, type RoomType, type TAnyMessageModel } from '../../../../definitions';
import database from '../../../../lib/database';
import { getMessageById } from '../../../../lib/database/services/Message';
import { getThreadById } from '../../../../lib/database/services/Thread';
import { tsToMs } from '../../../../lib/dayjs';
import { compareServerVersion, useDebounce } from '../../../../lib/methods/helpers';
import { readThreads } from '../../../../lib/services/restApi';
import { MESSAGE_TYPE_ANY_LOAD, type MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import { MAX_AUTO_LOADS, QUERY_SIZE } from '../constants';
import { buildVisibleSystemTypesClause } from './buildVisibleSystemTypesClause';
import { roomHistoryRequest } from '../../../../actions/room';
import { isNewerLoader, raiseOrRelease } from '../../services/anchorResolver';
import { findNewerLoaderAbove } from '../../services/getLocalAnchor';

const findFirstLoaderId = (messages: TAnyMessageModel[]): string | null =>
	messages.find(m => m.t && MESSAGE_TYPE_ANY_LOAD.includes(m.t as MessageTypeLoad))?.id ?? null;

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
	const [messages, setMessages] = useState<TAnyMessageModel[]>([]);
	// Optional UPPER ts bound for the Message Window. null => Live Window (newest-first, follows the
	// Live Tail). A finite number (ms since epoch) => Anchored Window pinned below the Live Tail.
	const [highTs, setHighTsState] = useState<number | null>(null);
	const thread = useRef<TAnyMessageModel | null>(null);
	const count = useRef(0);
	const subscription = useRef<Subscription | null>(null);
	const messagesIds = useRef<string[]>([]);
	const lastDispatchedLoaderId = useRef<string | null>(null);
	const autoLoadCount = useRef(0);
	// Tracks whether the boundary Newer Loader of the current Anchored Window (t === NEXT_CHUNK,
	// ts === highTs) was present in the PREVIOUS emit. When it flips present → absent, loadNextMessages
	// has consumed it → that is the rejoin signal. Reset whenever the anchor (highTs) changes.
	const boundaryLoaderPresent = useRef(false);
	const dispatch = useDispatch();
	const store = useStore<IApplicationState>();

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

	useEffect(() => readThread.cancel, [readThread]);

	// Rejoin the Live Tail from an Anchored Window. Called on each emit while anchored: when the
	// boundary Newer Loader (ts === highTs) flips present → absent, loadNextMessages has consumed it
	// and written the next batch + a new loader ABOVE the current bound — which the bounded
	// observation (ts <= highTs) cannot see. So read that region directly and let the pure resolver
	// decide whether to RAISE the bound (climb toward live) or RELEASE to a Live Window (Gap closed).
	const raiseOrReleaseAnchor = useCallback(
		async (observed: TAnyMessageModel[], currentHighTs: number) => {
			const wasPresent = boundaryLoaderPresent.current;
			const isPresent = observed.some(m => isNewerLoader(m) && tsToMs(m.ts) === currentHighTs);
			boundaryLoaderPresent.current = isPresent;

			// Only a present → absent transition is a consume. Anything else (still present, or never
			// present) leaves the anchor untouched.
			if (!wasPresent || isPresent) {
				return;
			}

			// Pin to the subscription that fired this emit. fetchMessages reassigns subscription.current on
			// every re-subscribe (room switch, another raise); if that happens during the awaits below, this
			// invocation is stale and must not mutate count / highTs for the new window.
			const sub = subscription.current;

			const loader = await findNewerLoaderAbove(rid, currentHighTs, 'closestToLiveTail');

			if (subscription.current !== sub) {
				return;
			}

			const next = raiseOrRelease(loader ? [loader] : [], currentHighTs);

			if (next === null) {
				// Gap closed → release to a Live Window. First grow count by the number of messages now
				// above the old bound (contiguous to the Live Tail, all cached): otherwise the released
				// take(count) re-anchors at the tail and evicts the deep target the user is reading,
				// snapping the list to live. Over-counting rows the visible window filters out (system /
				// thread rows) only adds harmless margin; a failed count still releases, just without growth.
				let aboveCount = 0;
				try {
					aboveCount = await database.active
						.get('messages')
						.query(Q.where('rid', rid), Q.where('ts', Q.gt(currentHighTs)))
						.fetchCount();
				} catch {
					// Best-effort: fall back to releasing without growth rather than getting stuck anchored.
				}
				if (subscription.current !== sub) {
					return;
				}
				count.current += aboveCount;
				setHighTsState(null);
				return;
			}
			// RAISE: climb the bound toward the Live Tail. We deliberately do NOT re-seed count here (the
			// public setHighTs would): leaving count intact lets fetchMessages' own `count += QUERY_SIZE`
			// GROW the window by one page on re-subscribe, so the original Chunk stays visible alongside
			// the newly-revealed batch and the user's reading position is preserved. The re-subscription's
			// first emit re-derives boundaryLoaderPresent from the new bound.
			setHighTsState(next);
		},
		[rid]
	);

	const fetchMessages = useCallback(async () => {
		unsubscribe();
		if (!rid) {
			return;
		}
		count.current += QUERY_SIZE;

		const db = database.active;
		// hideSystemMessages applied here so Q.take() counts only visible rows
		const visibleSystemClause = buildVisibleSystemTypesClause(hideSystemMessages);

		if (tmid) {
			// Prefer threads table; fall back to messages while thread record isn't available yet
			if (!thread.current || thread.current.collection.table !== 'threads') {
				thread.current = await getThreadById(tmid);
				if (!thread.current) {
					thread.current = await getMessageById(tmid);
				}
			}
		}

		const clauses: Q.Clause[] = [
			Q.where('rid', tmid ?? rid),
			...(visibleSystemClause ? [visibleSystemClause] : []),
			// Anchored Window upper bound (ts-only ordering: equal-ts rows can straddle the bound).
			...(highTs != null ? [Q.where('ts', Q.lte(highTs))] : []),
			...(!tmid && !showMessageInMainThread ? [Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true)))] : []),
			Q.sortBy('ts', Q.desc),
			Q.take(count.current)
		];

		const observable = db
			.get(tmid ? 'thread_messages' : 'messages')
			.query(...clauses)
			.observe();

		subscription.current = observable.subscribe(result => {
			const newMessages: TAnyMessageModel[] = tmid && thread.current ? [...result, thread.current] : result;

			// Thread / local windows are never anchored, so rejoin only applies to the bounded main room.
			if (!tmid && highTs != null) {
				raiseOrReleaseAnchor(result as TAnyMessageModel[], highTs).catch(() => {});
			}

			if (tmid) {
				readThread();
			}
			setMessages(newMessages);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- readThread is omitted intentionally: useDebouncedCallback stores func in a ref so changes propagate without recreating fetchMessages; hideSystemMessages must stay so the DB re-queries for proper pagination
	}, [rid, tmid, showMessageInMainThread, hideSystemMessages, highTs, unsubscribe, raiseOrReleaseAnchor]);

	// Setting an anchor re-seeds the window to a single standard page (QUERY_SIZE) instead of
	// continuing to grow: reset count, then change the bound. highTs is a fetchMessages dependency,
	// so the observation re-subscribes and fetchMessages' `count.current += QUERY_SIZE` lands it at
	// exactly QUERY_SIZE. Passing null releases the Anchored Window back to a Live Window.
	const setHighTs = useCallback((next: number | null) => {
		count.current = 0;
		// Fresh anchor (jump / jump-to-bottom): clear the boundary-loader tracking so the first emit of
		// the new bound cannot be mistaken for a consume (its wasPresent baseline starts false).
		boundaryLoaderPresent.current = false;
		setHighTsState(next);
	}, []);

	useLayoutEffect(() => {
		fetchMessages();
		return unsubscribe;
	}, [fetchMessages, unsubscribe]);

	useLayoutEffect(() => {
		messagesIds.current = messages.map(m => m.id);
	}, [messages]);

	useEffect(
		() => {
			lastDispatchedLoaderId.current = findFirstLoaderId(messages);
			autoLoadCount.current = 0;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps -- messages intentionally omitted: stale read at rid-change is the desired behaviour
		[rid]
	);

	/**
	 * Since 3.16.0, the server omits system messages when hideSystemMessages is set.
	 * Auto-dispatch until visible content appears or the safety cap is reached.
	 */
	useEffect(() => {
		// Anchored Window deliberately does not auto-follow; only a Live Window auto-dispatches.
		if (highTs != null) {
			return;
		}

		if (!compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.16.0') || !hideSystemMessages.length) {
			return;
		}

		if (autoLoadCount.current >= MAX_AUTO_LOADS) {
			return;
		}

		const loaderId = findFirstLoaderId(messages);

		if (loaderId && loaderId !== lastDispatchedLoaderId.current) {
			// Skip if a fetch for this loader is already in flight (push happens before the DB subscription emits)
			if (store.getState().room.historyLoaders.includes(loaderId)) {
				return;
			}
			lastDispatchedLoaderId.current = loaderId;
			autoLoadCount.current += 1;
			dispatch(roomHistoryRequest({ rid, t, loaderId }));
		}
	}, [highTs, serverVersion, rid, t, hideSystemMessages, messages, dispatch, store]);

	return [messages, messagesIds, fetchMessages, { highTs, setHighTs }] as const;
};
