import { type ILastMessage } from '../../definitions';
import { compareServerVersion } from './helpers';
import updateMessages from './updateMessages';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';
import { snapshotServerTimestamps, type TServerTimestamps, updateLastOpen } from './updateLastOpen';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { isRoomType } from './roomTypeToApiType';

const count = 50;

/**
 * The walk pages backwards with no natural floor, so an unbounded recursion can mass-insert a
 * room's whole history. Hitting the cap ends the walk with the cursor unadvanced, so the next
 * cycle re-walks the same pages — bounded work per cycle, at the cost of no forward progress
 * for a room whose gap exceeds the cap.
 */
const MAX_PAGES = 10;

const syncMessages = async ({ roomId, next, type }: { roomId: string; next: number; type: 'UPDATED' | 'DELETED' }) => {
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, next, count, type });
	return result;
};

const getSyncMessagesFromCursor = async (
	roomId: string,
	cursor?: number,
	updatedNext?: number | null,
	deletedNext?: number | null
) => {
	let updatedPromise;
	let deletedPromise;

	if (cursor && !updatedNext && !deletedNext) {
		updatedPromise = syncMessages({ roomId, next: cursor, type: 'UPDATED' });
		deletedPromise = syncMessages({ roomId, next: cursor, type: 'DELETED' });
	}
	if (updatedNext) {
		updatedPromise = syncMessages({ roomId, next: updatedNext, type: 'UPDATED' });
	}
	if (deletedNext) {
		deletedPromise = syncMessages({ roomId, next: deletedNext, type: 'DELETED' });
	}

	const [updatedMessages, deletedMessages] = await Promise.all([updatedPromise, deletedPromise]);
	return {
		deleted: deletedMessages?.deleted ?? [],
		deletedNext: deletedMessages?.cursor?.next ?? null,
		updated: updatedMessages?.updated ?? [],
		updatedNext: updatedMessages?.cursor?.next ?? null
	};
};

async function load({
	rid: roomId,
	updatedNext,
	deletedNext,
	isStale
}: {
	rid: string;
	updatedNext?: number | null;
	deletedNext?: number | null;
	isStale?: () => boolean;
}) {
	const sub = await getSubscriptionByRoomId(roomId);
	if (!sub) {
		return;
	}
	const cursor = sub.lastOpen;

	// No cursor to sync from, and no page pending: the sync walk cannot build a request at all, so
	// the room's missed messages are delegated to the room history load. That path is batch-capped
	// and emits a loader row for what it could not reach, and it seeds `lastOpen` from the server
	// timestamps it fetched, so the next reconnect syncs from a real cursor.
	// `sub.t` also carries values that are not room types ('e2e', 'thread'), which the history
	// endpoints cannot be resolved from, so an unrecognised one recovers nothing.
	if (!cursor && !updatedNext && !deletedNext) {
		if (isRoomType(sub.t)) {
			await loadMessagesForRoom({ rid: roomId, t: sub.t, isStale });
		}
		return;
	}

	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.1.0')) {
		const result = await getSyncMessagesFromCursor(roomId, cursor?.getTime(), updatedNext, deletedNext);
		return result;
	}

	// RC 0.60.0
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, lastUpdate: cursor?.toISOString() });
	return result;
}

export async function loadMissedMessages(args: {
	rid: string;
	updatedNext?: number | null;
	deletedNext?: number | null;
	serverTimestamps?: TServerTimestamps;
	/**
	 * Checked after every page: a fetch belonging to a connection cycle that has already ended can
	 * resolve late and overwrite newer rows or lower the cursor, so its result is dropped instead.
	 */
	isStale?: () => boolean;
	/** 1-based index of the page being fetched, used to stop the walk at `MAX_PAGES`. */
	page?: number;
}): Promise<void> {
	const page = args.page ?? 1;
	// A DELETED-only continuation fetches no UPDATED page, so it must not write the cursor again.
	const fetchedUpdatedPage = !!args.updatedNext || !args.deletedNext;
	const data = await load({
		rid: args.rid,
		updatedNext: args.updatedNext,
		deletedNext: args.deletedNext,
		isStale: args.isStale
	});
	if (args.isStale?.()) {
		return;
	}
	if (data) {
		const {
			updated,
			updatedNext,
			deleted,
			deletedNext
		}: { updated: ILastMessage[]; deleted: ILastMessage[]; updatedNext: number | null; deletedNext: number | null } = data;

		const serverTimestamps = [...(args.serverTimestamps ?? []), ...snapshotServerTimestamps(updated)];

		// @ts-ignore // TODO: remove loaderItem obligatoriness
		await updateMessages({ rid: args.rid, update: updated, remove: deleted });

		// Re-checked because the write above awaits: the cycle can end while it runs, and the cursor
		// has no monotonic clamp, so a stale write would lower it.
		if (args.isStale?.()) {
			return;
		}

		if ((deletedNext || updatedNext) && page < MAX_PAGES) {
			loadMissedMessages({
				rid: args.rid,
				updatedNext,
				deletedNext,
				serverTimestamps,
				isStale: args.isStale,
				page: page + 1
			}).catch(log);
		}

		// Only once the UPDATED cursor has drained, from the stamps of every page walked: the
		// pages descend from the newest, so the last one alone would lower the cursor. Advancing
		// mid-pagination would skip pages not yet fetched; `deleted` is never a source, its rows
		// carry no new history.
		if (fetchedUpdatedPage && !updatedNext) {
			await updateLastOpen(args.rid, serverTimestamps);
		}
	}
}
