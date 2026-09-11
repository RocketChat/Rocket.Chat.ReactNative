import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import log from './helpers/log';
import { type TSubscriptionModel } from '../../definitions';

export type TServerTimestamps = { _updatedAt?: string | Date | null }[];

export const snapshotServerTimestamps = (payload: TServerTimestamps): TServerTimestamps =>
	payload.map(message => ({ _updatedAt: message._updatedAt }));

export async function updateLastOpen(rid: string, payload: TServerTimestamps): Promise<void> {
	try {
		const timestamps = payload
			.map(message => message._updatedAt)
			.filter((updatedAt): updatedAt is string | Date => updatedAt != null)
			.map(updatedAt => new Date(updatedAt).getTime())
			.filter(t => !Number.isNaN(t));
		if (!timestamps.length) {
			return;
		}

		const lastOpen = new Date(Math.max(...timestamps));

		const subscription = await getSubscriptionByRoomId(rid);
		if (!subscription) {
			return;
		}

		const db = database.active;
		await db.write(async () => {
			if (subscription.syncStatus === 'deleted') {
				return;
			}
			await subscription.update((s: TSubscriptionModel) => {
				s.lastOpen = lastOpen;
			});
		});
	} catch (e) {
		log(e);
	}
}
