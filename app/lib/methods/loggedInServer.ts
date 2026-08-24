import { TOKEN_KEY } from '../constants/keys';
import database from '../database';
import UserPreferences from './userPreferences';

export const hasStoredLoginToken = (serverId: string): boolean => !!UserPreferences.getString(`${TOKEN_KEY}-${serverId}`);

export const findLoggedInServer = function* findLoggedInServer(): Generator<any, { id: string; version: string } | undefined> {
	const serversCollection = database.servers.get('servers');
	const servers = (yield serversCollection.query().fetch()) as { id: string; version: string }[];
	return servers.find(({ id }) => hasStoredLoginToken(id));
};
