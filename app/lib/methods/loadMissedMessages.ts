import { type ILastMessage } from '../../definitions';
import { compareServerVersion } from './helpers';
import { advanceSyncCursor, maxUpdatedAt } from './helpers/advanceSyncCursor';
import updateMessages from './updateMessages';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getNewestMessageUpdatedAt } from '../database/services/Message';

const count = 50;
const MAX_PAGES = 10;

const syncMessages = async ({ roomId, next, type }: { roomId: string; next: number; type: 'UPDATED' | 'DELETED' }) => {
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, next, count, type });
	return result;
};

const getSyncMessagesFromCursor = async (
	roomId: string,
	lastOpen?: number,
	updatedNext?: number | null,
	deletedNext?: number | null
) => {
	const isInitialFetch = !!lastOpen && !updatedNext && !deletedNext;
	const updatedCursor = updatedNext || (isInitialFetch ? lastOpen : undefined);
	const deletedCursor = deletedNext || (isInitialFetch ? lastOpen : undefined);

	const [updatedResult, deletedResult] = await Promise.all([
		updatedCursor ? syncMessages({ roomId, next: updatedCursor, type: 'UPDATED' }) : undefined,
		deletedCursor ? syncMessages({ roomId, next: deletedCursor, type: 'DELETED' }) : undefined
	]);

	return {
		deleted: deletedResult?.deleted ?? [],
		deletedNext: deletedResult?.cursor?.next ?? null,
		updated: updatedResult?.updated ?? [],
		updatedNext: updatedResult?.cursor?.next ?? null
	};
};

// A room never opened on this device (a push notification tap) has no lastOpen, and an undefined
// cursor makes the sync fetch nothing at all. Candidates are ordered by how well each answers
// "newest point THIS device is in sync with" — `ls` is written by every device, so it can sit past
// messages this one never received. Epoch 0 means an unseeded non-optional column, not a cursor.
const getLastUpdate = async (rid: string): Promise<Date | null> => {
	const sub = await getSubscriptionByRoomId(rid);
	if (!sub) {
		return null;
	}
	const candidates = [sub.lastOpen, await getNewestMessageUpdatedAt(rid), sub.ls, sub.ts];
	const cursor = candidates.find(candidate => candidate && new Date(candidate).getTime() > 0);
	return cursor ? new Date(cursor) : null;
};

async function load({
	rid: roomId,
	lastOpen,
	updatedNext,
	deletedNext
}: {
	rid: string;
	lastOpen?: Date;
	updatedNext?: number | null;
	deletedNext?: number | null;
}) {
	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.1.0')) {
		let lastOpenTimestamp;
		if (lastOpen) {
			lastOpenTimestamp = new Date(lastOpen).getTime();
		} else {
			const lastUpdate = await getLastUpdate(roomId);
			lastOpenTimestamp = lastUpdate?.getTime();
		}
		const result = await getSyncMessagesFromCursor(roomId, lastOpenTimestamp, updatedNext, deletedNext);
		return result;
	}

	let lastOpenISOString;
	if (lastOpen) {
		lastOpenISOString = new Date(lastOpen).toISOString();
	} else {
		const lastUpdate = await getLastUpdate(roomId);
		lastOpenISOString = lastUpdate?.toISOString();
	}
	// RC 0.60.0
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, lastUpdate: lastOpenISOString });
	return result;
}

// Persists each page as it arrives (idempotent) and threads the newest server `_updatedAt`
// seen so far, so no page payload outlives the page. The cursor advances only after the whole
// chain succeeds: advancing per page can skip records the other stream still has pending if a
// later page fails. The chain is bounded — the next sync resumes from the persisted cursor.
async function syncPages(
	args: { rid: string; lastOpen?: Date; updatedNext?: number | null; deletedNext?: number | null },
	page: number,
	highestUpdatedAt: number
): Promise<number> {
	const data = await load({
		rid: args.rid,
		lastOpen: args.lastOpen,
		updatedNext: args.updatedNext,
		deletedNext: args.deletedNext
	});
	if (!data) {
		return highestUpdatedAt;
	}
	const {
		updated,
		updatedNext,
		deleted,
		deletedNext
	}: {
		updated: ILastMessage[];
		// the server projects deleted records down to these two fields, so they carry no
		// `_updatedAt` and can never feed the cursor
		deleted: { _id: string; _deletedAt: string }[];
		updatedNext: number | null;
		deletedNext: number | null;
	} = data;
	// @ts-ignore // TODO: remove loaderItem obligatoriness
	await updateMessages({ rid: args.rid, update: updated, remove: deleted });
	const highest = Math.max(highestUpdatedAt, maxUpdatedAt(updated));

	if ((deletedNext || updatedNext) && page + 1 < MAX_PAGES) {
		return syncPages({ rid: args.rid, lastOpen: args.lastOpen, updatedNext, deletedNext }, page + 1, highest);
	}
	return highest;
}

export async function loadMissedMessages(args: {
	rid: string;
	lastOpen?: Date;
	updatedNext?: number | null;
	deletedNext?: number | null;
}): Promise<void> {
	const highestUpdatedAt = await syncPages(args, 0, 0);
	await advanceSyncCursor(args.rid, highestUpdatedAt);
}
