import { compareServerVersion } from './helpers';
import updateMessages from './updateMessages';
import sdk from '../services/sdk';
import { store } from '../store/auxStore';
import { getSubscriptionByRoomId } from '../database/services/Subscription';

const count = 50;

const syncMessages = async ({ roomId, previous, type }: { roomId: string; previous: number; type: 'UPDATED' | 'DELETED' }) => {
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, previous, count, type });
	return result;
};

const getSyncMessagesFromCursor = async (roomId: string, lastOpen: number) => {
	const promises = [];

	if (lastOpen) {
		promises.push(syncMessages({ roomId, previous: lastOpen, type: 'UPDATED' }));
		promises.push(syncMessages({ roomId, previous: lastOpen, type: 'DELETED' }));
	}

	const [updatedMessages, deletedMessages] = await Promise.all(promises);
	return {
		deleted: deletedMessages?.deleted ?? [],
		deletedNext: deletedMessages?.cursor.next,
		updated: updatedMessages?.updated ?? [],
		updatedNext: updatedMessages?.cursor.next
	};
};

const getLastUpdate = async (rid: string) => {
	const sub = await getSubscriptionByRoomId(rid);
	if (!sub) {
		return null;
	}
	return sub.lastOpen;
};

async function loadPreviousMessages({ rid: roomId, lastOpen }: { rid: string; lastOpen?: Date }) {
	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.1.0')) {
		let lastOpenTimestamp;
		if (lastOpen) {
			lastOpenTimestamp = new Date(lastOpen).getTime();
		} else {
			const lastUpdate = await getLastUpdate(roomId);
			lastOpenTimestamp = lastUpdate?.getTime();
		}
		if (!lastOpenTimestamp) {
			return;
		}
		const result = await getSyncMessagesFromCursor(roomId, lastOpenTimestamp);

		await updateMessages({ rid: roomId, update: result.updated, remove: result.deleted });
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

export default loadPreviousMessages;
