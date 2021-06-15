import database from '..';
import { TABLE_NAME } from '../model/Subscription';

const getCollection = db => db.get(TABLE_NAME);

export const getSubscriptionByRoomId = async(rid) => {
	const db = database.active;
	const subCollection = getCollection(db);
	try {
		const result = await subCollection.find(rid);
		return result;
	} catch (error) {
		return null;
	}
};
