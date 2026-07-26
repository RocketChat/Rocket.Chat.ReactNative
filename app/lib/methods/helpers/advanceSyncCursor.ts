import database from '../../database';
import { type TSubscriptionModel } from '../../../definitions';
import log from './log';

interface IPayloadMessage {
	_updatedAt?: string | Date | number;
}

export const maxPayloadUpdatedAt = (messages: IPayloadMessage[]): number => {
	let max = 0;
	for (const message of messages) {
		const value = message._updatedAt;
		if (value === undefined || value === null) {
			continue;
		}
		const ms = typeof value === 'number' ? value : new Date(value).getTime();
		if (!Number.isNaN(ms) && ms > max) {
			max = ms;
		}
	}
	return max;
};

// The sync cursor is computed from raw server response payloads only.
// Never pass a WatermelonDB row's _updatedAt or Date.now() as candidateMs.
export const advanceSyncCursor = async (rid: string, candidateMs: number): Promise<void> => {
	try {
		const db = database.active;
		await db.write(async () => {
			let subscription: TSubscriptionModel | null = null;
			try {
				subscription = await db.get('subscriptions').find(rid);
			} catch {
				return;
			}
			const currentMs = subscription.lastOpen?.getTime() ?? 0;
			if (candidateMs > currentMs) {
				await subscription.update((s: TSubscriptionModel) => {
					s.lastOpen = new Date(candidateMs);
				});
			}
		});
	} catch (e) {
		log(e);
	}
};
