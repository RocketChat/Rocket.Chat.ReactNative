import database from '..';
import { SUBSCRIPTIONS_TABLE } from '../model/Subscription';

const getCollection = db => db.get(SUBSCRIPTIONS_TABLE);

export const getSubscriptionByRoomId = async rid => {
	const db = database.active;
	const subCollection = getCollection(db);
	try {
		const result = await subCollection.find(rid);
		return result;
	} catch (error) {
		return null;
	}
};
