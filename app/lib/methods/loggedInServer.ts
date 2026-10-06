import { type TServerModel } from '~/definitions';
import { getServerUserIdKey, getUserTokenKey } from '../constants/keys';
import { getAllServers } from '../database/services/Server';
import UserPreferences from './userPreferences';

export const getStoredSession = (server: string): { userId: string | null; token: string | null } => {
	const userId = UserPreferences.getString(getServerUserIdKey(server));
	const token = userId ? UserPreferences.getString(getUserTokenKey(server, userId)) : null;
	return { userId, token };
};

export const isLoggedInServer = (serverId?: string | null): boolean => !!serverId && !!getStoredSession(serverId).userId;

export const findLoggedInServer = async (): Promise<TServerModel | undefined> =>
	(await getAllServers()).find(({ id }) => isLoggedInServer(id));
