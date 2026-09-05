import { type TServerModel } from '../../definitions';
import { getServerUserIdKey } from '../constants/keys';
import { getAllServers } from '../database/services/Server';
import UserPreferences from './userPreferences';

export const isLoggedInServer = (serverId?: string | null): boolean =>
	!!serverId && !!UserPreferences.getString(getServerUserIdKey(serverId));

export const findLoggedInServer = async (): Promise<TServerModel | undefined> =>
	(await getAllServers()).find(({ id }) => isLoggedInServer(id));
