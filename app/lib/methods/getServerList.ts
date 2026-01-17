import { type TServerModel } from '../../definitions';
import database from '../database';

export const getServersList = async (): Promise<TServerModel[]> => {
	const serversDB = database.servers;

	const servers: TServerModel[] = await serversDB.get('servers').query().fetch();

	return servers;
};
