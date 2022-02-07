import database from '..';
import { THREADS_TABLE } from '../model/Thread';

const getCollection = db => db.get(THREADS_TABLE);

export const getThreadById = async tmid => {
	const db = database.active;
	const threadCollection = getCollection(db);
	try {
		const result = await threadCollection.find(tmid);
		return result;
	} catch (error) {
		return null;
	}
};
