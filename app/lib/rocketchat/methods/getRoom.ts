import { ISubscription } from '../../../definitions';
import database from '../../database';

export default async function getRoom(rid: string): Promise<ISubscription> {
	try {
		const db = database.active;
		const room: ISubscription = await db.get('subscriptions').find(rid);
		return Promise.resolve(room);
	} catch (error) {
		return Promise.reject(new Error('Room not found'));
	}
}
