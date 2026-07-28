import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';
import { type TSubscriptionModel } from '../../definitions';

export type TServerTimestamps = { _updatedAt?: string | Date }[];

export const snapshotServerTimestamps = (payload: TServerTimestamps): TServerTimestamps =>
	payload.map(message => ({ _updatedAt: message._updatedAt }));

/**
 * Persists the Last Open as the newest server `_updatedAt` actually received, so the next
 * `chat.syncMessages` resumes from a server-clock value the server can compare against.
 * Must run on the RAW payload: normalizeMessage invents `_updatedAt` from the device clock.
 */
export async function updateLastOpen(rid: string, payload: TServerTimestamps): Promise<void> {
	try {
		const timestamps = payload.map(m => new Date(m._updatedAt as string | Date).getTime()).filter(t => !Number.isNaN(t));
		if (!timestamps.length) {
			return;
		}

		const lastOpen = new Date(Math.max(...timestamps));

		const subscription = await getSubscriptionByRoomId(rid);
		if (!subscription) {
			return;
		}

		// Deliberately not monotonic: server `_updatedAt` is authoritative, so an older value only
		// heals a poisoned cursor. The worst outcome is re-fetching history that is already local.
		const db = database.active;
		await db.write(async () => {
			await subscription.update((s: TSubscriptionModel) => {
				s.lastOpen = lastOpen;
			});
		});
	} catch (e) {
		log(e);
	}
}
