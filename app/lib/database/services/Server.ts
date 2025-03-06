import { TServerModel } from '../../../definitions';
import database from '..';
import { TServerDatabase } from '../interfaces';
import { SERVERS_TABLE } from '../model';

const getCollection = (db: TServerDatabase) => db.get(SERVERS_TABLE);

export const getServerById = async (server: string): Promise<TServerModel | null> => {
	const db = database.servers;
	const serverCollection = getCollection(db);
	try {
		const result = await serverCollection.find(server);
		return result;
	} catch {
		return null;
	}
};
