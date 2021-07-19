import database from '..';
import { TABLE_NAME } from '../model/Thread';

const getCollection = db => db.get(TABLE_NAME);

export const getThreadById = async(tmid) => {
	const db = database.active;
	const threadCollection = getCollection(db);
	try {
		const result = await threadCollection.find(tmid);
		return result;
	} catch (error) {
		return null;
	}
};
