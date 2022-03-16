import database from '..';
import { TAppDatabase } from '../interfaces';
import { THREADS_TABLE } from '../model/Thread';

const getCollection = (db: TAppDatabase) => db.get(THREADS_TABLE);

export const getThreadById = async (tmid: string) => {
	const db = database.active;
	const threadCollection = getCollection(db);
	try {
		const result = await threadCollection.find(tmid);
		return result;
	} catch (error) {
		return null;
	}
};
