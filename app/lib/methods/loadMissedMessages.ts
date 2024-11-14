import { ILastMessage } from '../../definitions';
import { compareServerVersion } from './helpers';
import updateMessages from './updateMessages';
import log from './helpers/log';
import database from '../database';
import sdk from '../services/sdk';
import store from '../../lib/store';

const count = 50;

const getLastUpdate = async (rid: string) => {
	try {
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const sub = await subsCollection.find(rid);
		return sub.lastOpen;
	} catch (e) {
		// Do nothing
	}
	return null;
};

const getUpdatedMessages = async ({ roomId, next }: { roomId: string; next: number }) => {
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, next, count, type: 'UPDATED' });
	return result;
};

const getDeletedMessages = async ({ roomId, next }: { roomId: string; next: number }) => {
	// @ts-ignore // this method dont have type
	const { result } = await sdk.get('chat.syncMessages', { roomId, next, count, type: 'DELETED' });
	return result;
};

const syncMessages = async (roomId: string, lastOpen?: number, updatedNext?: number | null, deletedNext?: number | null) => {
	try {
		const promises = [];

		if (lastOpen && !updatedNext && !deletedNext) {
			promises.push(getUpdatedMessages({ roomId, next: lastOpen }));
			promises.push(getDeletedMessages({ roomId, next: lastOpen }));
		}
		if (updatedNext && typeof updatedNext !== 'undefined') {
			promises.push(getUpdatedMessages({ roomId, next: updatedNext }));
		}
		if (deletedNext && typeof deletedNext !== 'undefined') {
			promises.push(getDeletedMessages({ roomId, next: deletedNext }));
		}

		const [updatedMessages, deletedMessages] = await Promise.all(promises);
		console.log(updatedMessages, deletedMessages, 'raw');
		return {
			deleted: deletedMessages?.deleted ?? [],
			deletedNext: deletedMessages?.cursor.next,
			updated: updatedMessages?.updated ?? [],
			updatedNext: updatedMessages?.cursor.next
		};
	} catch (error) {
		console.error('Error syncing messages:', error);
		throw error;
	}
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
	console.log('cai aqui', lastOpen, updatedNext, deletedNext);
	const { version: serverVersion } = store.getState().server;
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.1.0')) {
		let lastOpenTimestamp;
		if (lastOpen) {
			lastOpenTimestamp = new Date(lastOpen).getTime();
		} else {
			const lastUpdate = await getLastUpdate(roomId);
			lastOpenTimestamp = lastUpdate?.getTime();
		}
		const result = await syncMessages(roomId, lastOpenTimestamp, updatedNext, deletedNext);
		console.log(result, 'result');
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
	console.log('here', args);
	if (args.rid === 'terst') return;
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

			if ((deleted.length === count && deletedNext) || (updatedNext && updated.length === count)) {
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
