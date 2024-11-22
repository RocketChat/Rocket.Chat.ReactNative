import { ILastMessage } from '../../definitions';
import { compareServerVersion } from './helpers';
import updateMessages from './updateMessages';
import log from './helpers/log';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

const count = 50;

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
	try {
		const promises = [];

		if (lastOpen && !updatedNext && !deletedNext) {
			promises.push(syncMessages({ roomId, next: lastOpen, type: 'UPDATED' }));
			promises.push(syncMessages({ roomId, next: lastOpen, type: 'DELETED' }));
		}
		if (updatedNext) {
			promises.push(syncMessages({ roomId, next: updatedNext, type: 'UPDATED' }));
		}
		if (deletedNext) {
			promises.push(syncMessages({ roomId, next: deletedNext, type: 'DELETED' }));
		}

		const [updatedMessages, deletedMessages] = await Promise.all(promises);
		return {
			deleted: deletedMessages?.deleted ?? [],
			deletedNext: deletedMessages?.cursor.next,
			updated: updatedMessages?.updated ?? [],
			updatedNext: updatedMessages?.cursor.next
		};
	} catch (error) {
		log(error);
	}
};

const getLastUpdate = async (rid: string) => {
	const sub = await getSubscriptionByRoomId(rid);
	if (!sub) {
		return null;
	}
	return sub.lastOpen;
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

export async function loadMissedMessages(args: {
	rid: string;
	lastOpen?: Date;
	updatedNext?: number | null;
	deletedNext?: number | null;
}): Promise<void> {
	try {
		const data = await load({
			rid: args.rid,
			lastOpen: args.lastOpen,
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
			// @ts-ignore // TODO: remove loaderItem obligatoriness
			await updateMessages({ rid: args.rid, update: updated, remove: deleted });

			if (deletedNext || updatedNext) {
				loadMissedMessages({
					rid: args.rid,
					lastOpen: args.lastOpen,
					updatedNext,
					deletedNext
				});
			}
		}
	} catch (e) {
		log(e);
	}
}
