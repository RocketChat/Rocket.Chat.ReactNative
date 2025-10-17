import database from '..';
import { type TSubscriptionModel } from '../../../definitions';
import { type TAppDatabase } from '../interfaces';
import { SUBSCRIPTIONS_TABLE } from '../model/Subscription';

const getCollection = (db: TAppDatabase) => db.get(SUBSCRIPTIONS_TABLE);

export const getSubscriptionByRoomId = async (rid: string): Promise<TSubscriptionModel | null> => {
	const db = database.active;
	const subCollection = getCollection(db);
	try {
		const result = await subCollection.find(rid);
		return result;
	} catch (error) {
		return null;
	}
};
