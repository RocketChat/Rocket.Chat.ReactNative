import { type ILastMessage } from '~/definitions/IMessage';
import { compareServerVersion } from './helpers/compareServerVersion';
import updateMessages from './updateMessages';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';
import { snapshotServerTimestamps, type TServerTimestamps, updateLastOpen } from './updateLastOpen';
import { loadMessagesForRoom, waitForLiveTailLoad } from './loadMessagesForRoom';
import { isRoomType } from './roomTypeToApiType';

const count = 50;

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
		deletedNext: deletedMessages?.cursor.next,
		updated: updatedMessages?.updated ?? [],
		updatedNext: updatedMessages?.cursor.next
	};
};

async function load({
	rid: roomId,
	updatedNext,
	deletedNext
}: {
	rid: string;
	updatedNext?: number | null;
	deletedNext?: number | null;
}) {
	const sub = await getSubscriptionByRoomId(roomId);
	if (!sub) {
		return;
	}
	const cursor = sub.lastOpen;

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

const LIVE_TAIL_WAIT_LIMIT = 10000;

const waitAtMost = (promise: Promise<void>, limit: number): Promise<void> =>
	new Promise(resolve => {
		const timer = setTimeout(resolve, limit);
		promise.then(() => {
			clearTimeout(timer);
			resolve();
		});
	});

const getSubscriptionOnceCursorSettles = async (rid: string) => {
	const sub = await getSubscriptionByRoomId(rid);
	if (!sub || sub.lastOpen) {
		return sub;
	}
	await waitAtMost(waitForLiveTailLoad(rid), LIVE_TAIL_WAIT_LIMIT);
	return getSubscriptionByRoomId(rid);
};

const catchUpWithoutSyncing = async (rid: string, signal?: AbortSignal): Promise<boolean> => {
	const sub = await getSubscriptionOnceCursorSettles(rid);
	if (signal?.aborted) {
		return true;
	}
	if (sub && !sub.lastOpen && isRoomType(sub.t)) {
		await loadMessagesForRoom({ rid, t: sub.t });
		return true;
	}
	return false;
};

export async function loadMissedMessages(args: {
	rid: string;
	updatedNext?: number | null;
	deletedNext?: number | null;
	serverTimestamps?: TServerTimestamps;
	signal?: AbortSignal;
}): Promise<void> {
	const isFirstPage = !args.updatedNext && !args.deletedNext;
	if (isFirstPage && (await catchUpWithoutSyncing(args.rid, args.signal))) {
		return;
	}

	// A DELETED-only continuation fetches no UPDATED page, so it must not write the cursor again.
	const fetchedUpdatedPage = !!args.updatedNext || !args.deletedNext;
	const data = await load({
		rid: args.rid,
		updatedNext: args.updatedNext,
		deletedNext: args.deletedNext
	});
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

		if (deletedNext || updatedNext) {
			loadMissedMessages({
				rid: args.rid,
				updatedNext,
				deletedNext,
				serverTimestamps
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
