import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';
import { type TSubscriptionModel } from '../../definitions';

/**
 * Persists the Last Open as the newest server `_updatedAt` actually received, so the next
 * `chat.syncMessages` resumes from a server-clock value the server can compare against.
 * Must run on the RAW payload: normalizeMessage invents `_updatedAt` from the device clock.
 */
export async function updateLastOpen(rid: string, payload: { _updatedAt?: string | Date }[]): Promise<void> {
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

		// Deliberately not monotonic: a monotonic guard would make an already-poisoned
		// future cursor immortal, so an older server value must be allowed to heal it.
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
