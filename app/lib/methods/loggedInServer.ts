import { type TServerModel } from '../../definitions';
import { TOKEN_KEY } from '../constants/keys';
import database from '../database';
import { SERVERS_TABLE } from '../database/model';
import UserPreferences from './userPreferences';

export const hasStoredLoginToken = (serverId: string): boolean => !!UserPreferences.getString(`${TOKEN_KEY}-${serverId}`);

export const findLoggedInServer = function* findLoggedInServer(): Generator<any, TServerModel | undefined> {
	const serversCollection = database.servers.get(SERVERS_TABLE);
	const servers = (yield serversCollection.query().fetch()) as TServerModel[];
	return servers.find(({ id }) => hasStoredLoginToken(id));
};
