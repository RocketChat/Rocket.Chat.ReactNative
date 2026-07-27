import { type ILastMessage } from '../../definitions';
import { compareServerVersion } from './helpers';
import log from './helpers/log';
import updateMessages from './updateMessages';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { type RoomTypes, types } from './roomTypeToApiType';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { writeSyncWatermark } from './writeSyncWatermark';

const count = 50;

const isRoomType = (t: unknown): t is RoomTypes => typeof t === 'string' && t in types;

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
	const persistedCursor = sub?.lastOpen;

	// A cursor in the future was written from a skewed device clock; the server would report
	// nothing newer than it, permanently hiding messages. Treat it as absent so it self-heals.
	const cursor = persistedCursor && persistedCursor.getTime() > Date.now() ? undefined : persistedCursor;

	// A room first opened from a push notification has no cursor; syncing from
	// nothing would fetch nothing, so fall back to a full recent-history load.
	if (!cursor && !updatedNext && !deletedNext) {
		const roomType = sub?.t;
		if (!isRoomType(roomType)) {
			log(new Error(`loadMissedMessages: cannot resolve room type for ${roomId}`));
			return null;
		}
		await loadMessagesForRoom({ rid: roomId, t: roomType });
		return null;
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
}): Promise<void> {
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

		// Snapshot before updateMessages: buildMessage mutates these rows and stamps a
		// device-clock `_updatedAt` onto any row that lacks one.
		const serverUpdatedAt = updated.map(message => ({ _updatedAt: message._updatedAt }));

		// @ts-ignore // TODO: remove loaderItem obligatoriness
		await updateMessages({ rid: args.rid, update: updated, remove: deleted });

		if (deletedNext || updatedNext) {
			loadMissedMessages({
				rid: args.rid,
				updatedNext,
				deletedNext
			});
		}

		// Only once the UPDATED cursor has drained. Advancing mid-pagination would skip the
		// pages not yet fetched; `deleted` is never a source, its rows carry no new history.
		if (!updatedNext) {
			await writeSyncWatermark(args.rid, serverUpdatedAt);
		}
	}
}
