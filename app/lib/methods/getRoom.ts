import { TSubscriptionModel } from '../../definitions';
import database from '../database';

export async function getRoom(rid: string): Promise<TSubscriptionModel> {
	try {
		const db = database.active;
		const room = await db.get('subscriptions').find(rid);
		return Promise.resolve(room);
	} catch (error) {
		return Promise.reject(new Error('Room not found'));
	}
}
