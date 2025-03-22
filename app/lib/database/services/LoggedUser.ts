import { TLoggedUserModel } from '../../../definitions';
import database from '..';
import { TServerDatabase } from '../interfaces';
import { LOGGED_USERS_TABLE } from '../model';

const getCollection = (db: TServerDatabase) => db.get(LOGGED_USERS_TABLE);

export const getLoggedUserById = async (userId: string): Promise<TLoggedUserModel | null> => {
	const db = database.servers;
	const userCollection = getCollection(db);
	try {
		const result = await userCollection.find(userId);
		return result;
	} catch {
		return null;
	}
};
