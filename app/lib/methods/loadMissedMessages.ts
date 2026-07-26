import { type ILastMessage, SubscriptionType } from '../../definitions';
import { compareServerVersion } from './helpers';
import updateMessages from './updateMessages';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { loadMessagesForRoom } from './loadMessagesForRoom';
import { type RoomTypes } from './roomTypeToApiType';
import log from './helpers/log';
import { advanceSyncCursor, maxPayloadUpdatedAt } from './helpers/advanceSyncCursor';

const count = 50;

const isRoomType = (t: string | undefined): t is RoomTypes =>
	t === SubscriptionType.CHANNEL ||
	t === SubscriptionType.DIRECT ||
	t === SubscriptionType.GROUP ||
	t === SubscriptionType.OMNICHANNEL;

const resolveRoomType = (subT: string | undefined, fallbackT?: RoomTypes): RoomTypes | null => {
	if (subT && isRoomType(subT)) {
		return subT;
	}
	if (fallbackT) {
		return fallbackT;
	}
	return null;
};

const syncMessages = async ({ roomId, next, type }: { roomId: string; next: number; type: 'UPDATED' | 'DELETED' }) => {
	// @ts-expect-error chat.syncMessages is not in the generated REST types yet
	const { result } = await sdk.get('chat.syncMessages', { roomId, next, count, type });
	return result;
};

const getSyncMessagesFromCursor = async (
	roomId: string,
	lastOpen: number,
	updatedNext: number | null,
	deletedNext: number | null
): Promise<{ updated: ILastMessage[]; deleted: ILastMessage[]; updatedNext: number | null; deletedNext: number | null }> => {
	const promises = [];
	const types: ('UPDATED' | 'DELETED')[] = [];

	if (!updatedNext && !deletedNext) {
		promises.push(syncMessages({ roomId, next: lastOpen, type: 'UPDATED' }));
		promises.push(syncMessages({ roomId, next: lastOpen, type: 'DELETED' }));
		types.push('UPDATED', 'DELETED');
	} else {
		if (updatedNext) {
			promises.push(syncMessages({ roomId, next: updatedNext, type: 'UPDATED' }));
			types.push('UPDATED');
		}
		if (deletedNext) {
			promises.push(syncMessages({ roomId, next: deletedNext, type: 'DELETED' }));
			types.push('DELETED');
		}
	}

	const results = await Promise.all(promises);
	const updatedMessages = results[types.indexOf('UPDATED')];
	const deletedMessages = results[types.indexOf('DELETED')];

	return {
		deleted: deletedMessages?.deleted ?? [],
		deletedNext: deletedMessages?.cursor.next ?? null,
		updated: updatedMessages?.updated ?? [],
		updatedNext: updatedMessages?.cursor.next ?? null
	};
};

const syncFromLegacyCursor = async (roomId: string, lastUpdate: string) => {
	// @ts-expect-error chat.syncMessages is not in the generated REST types yet
	const { result } = await sdk.get('chat.syncMessages', { roomId, lastUpdate });
	return result ?? {};
};

export async function loadMissedMessages({ rid, t: fallbackT }: { rid: string; t?: RoomTypes }): Promise<void> {
	const sub = await getSubscriptionByRoomId(rid);
	const type = resolveRoomType(sub?.t, fallbackT);

	if (!type) {
		log(`loadMissedMessages: unresolved room type for ${rid}`);
		return;
	}

	const lastOpen = sub?.lastOpen;
	if (!lastOpen || lastOpen.getTime() === 0) {
		await loadMessagesForRoom({ rid, t: type });
		return;
	}

	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.1.0')) {
		let updatedNext: number | null = null;
		let deletedNext: number | null = null;
		let updatedMax = 0;

		// Pages must be processed sequentially; the next cursor depends on the previous response.
		/* eslint-disable no-await-in-loop */
		for (;;) {
			const {
				updated,
				deleted,
				updatedNext: nextUpdatedNext,
				deletedNext: nextDeletedNext
			} = await getSyncMessagesFromCursor(rid, lastOpen.getTime(), updatedNext, deletedNext);

			const pageMax = maxPayloadUpdatedAt(updated);
			if (pageMax > updatedMax) {
				updatedMax = pageMax;
			}

			// @ts-ignore TODO: remove loaderItem obligatoriness
			await updateMessages({ rid, update: updated, remove: deleted });

			updatedNext = nextUpdatedNext;
			deletedNext = nextDeletedNext;

			if (updatedNext == null && deletedNext == null) {
				if (updatedMax > 0) {
					await advanceSyncCursor(rid, updatedMax);
				}
				return;
			}
		}
		/* eslint-enable no-await-in-loop */
	}

	const { updated, deleted } = await syncFromLegacyCursor(rid, lastOpen.toISOString());
	const cursorMax = maxPayloadUpdatedAt(updated ?? []);

	// @ts-ignore TODO: remove loaderItem obligatoriness
	await updateMessages({ rid, update: updated ?? [], remove: deleted ?? [] });

	if (cursorMax > 0) {
		await advanceSyncCursor(rid, cursorMax);
	}
}
