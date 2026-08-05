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
 * Nothing stops this walk on its own, so without a cap it can pull down a room's entire history.
 * When we hit the cap we stop without saving the cursor, so the next reconnect starts over from
 * the same place. That means a room further behind than 10 pages never catches up here.
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

	// Without a cursor there is nothing to sync from, so we fall back to loading the room's recent
	// history instead. That load stops after a few batches and leaves a "load more" row behind for
	// whatever it didn't reach, and it saves a real cursor so the next reconnect can sync normally.
	// `sub.t` can also hold things that aren't rooms ('e2e', 'thread'); there's no history endpoint
	// for those, so we skip them.
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
	/** Which page we're on, starting at 1. Only used to stop the walk once it reaches `MAX_PAGES`. */
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
