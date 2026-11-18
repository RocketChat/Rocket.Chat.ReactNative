import { type TServerModel } from '~/definitions/IServer';
import database from '..';
import { type TServerDatabase } from '../interfaces';
import { SERVERS_TABLE } from '../model/servers/Server';

const getCollection = (db: TServerDatabase) => db.get(SERVERS_TABLE);

export const getServerById = async (server: string): Promise<TServerModel | null> => {
	try {
		return await getCollection(database.servers).find(server);
	} catch {
		return null;
	}
};

export const getAllServers = (): Promise<TServerModel[]> => getCollection(database.servers).query().fetch();
