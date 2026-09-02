import { type TServerModel } from '../../definitions';
import { TOKEN_KEY } from '../constants/keys';
import { getAllServers } from '../database/services/Server';
import UserPreferences from './userPreferences';

export const isLoggedInServer = (serverId?: string | null): boolean =>
	!!serverId && !!UserPreferences.getString(`${TOKEN_KEY}-${serverId}`);

export const findLoggedInServer = async (): Promise<TServerModel | undefined> =>
	(await getAllServers()).find(({ id }) => isLoggedInServer(id));
