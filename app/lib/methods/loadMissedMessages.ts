import { type ILastMessage } from '../../definitions';
import { compareServerVersion } from './helpers';
import updateMessages from './updateMessages';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import log from './helpers/log';
import { snapshotServerTimestamps, type TServerTimestamps, updateLastOpen } from './updateLastOpen';

const count = 50;

const syncMessages = async ({ roomId, next, type }: { roomId: string; next: number; type: 'UPDATED' | 'DELETED' }) => {
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, next, count, type });
	return result;
};

const getSyncMessagesFromCursor = async (
	roomId: string,
	cursor: number,
	updatedNext?: number | null,
	deletedNext?: number | null
) => {
	let updatedPromise;
	let deletedPromise;

	if (!updatedNext && !deletedNext) {
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
	cursor,
	updatedNext,
	deletedNext
}: {
	rid: string;
	cursor: Date;
	updatedNext?: number | null;
	deletedNext?: number | null;
}) {
	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.1.0')) {
		return getSyncMessagesFromCursor(roomId, cursor.getTime(), updatedNext, deletedNext);
	}

	// RC 0.60.0
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, lastUpdate: cursor.toISOString() });
	return result;
}

export async function loadMissedMessages(args: {
	rid: string;
	cursor: Date;
	updatedNext?: number | null;
	deletedNext?: number | null;
	serverTimestamps?: TServerTimestamps;
}): Promise<void> {
	// A DELETED-only continuation fetches no UPDATED page, so it must not write the cursor again.
	const fetchedUpdatedPage = !!args.updatedNext || !args.deletedNext;
	const data = await load({
		rid: args.rid,
		cursor: args.cursor,
		updatedNext: args.updatedNext,
		deletedNext: args.deletedNext
	});
	if (!data) {
		return;
	}

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
		try {
			await loadMissedMessages({
				rid: args.rid,
				cursor: args.cursor,
				updatedNext,
				deletedNext,
				serverTimestamps
			});
		} catch (e) {
			log(e);
			return;
		}
	}

	// Only once the UPDATED cursor has drained, from the stamps of every page walked: the
	// pages descend from the newest, so the last one alone would lower the cursor. Advancing
	// mid-pagination would skip pages not yet fetched; `deleted` is never a source, its rows
	// carry no new history.
	if (fetchedUpdatedPage && !updatedNext) {
		await updateLastOpen(args.rid, serverTimestamps);
	}
}
