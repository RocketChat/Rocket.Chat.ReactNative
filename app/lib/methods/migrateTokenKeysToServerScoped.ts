import { TOKEN_KEY, TOKEN_KEY_SERVER_SCOPED_MIGRATED, getUserTokenKey } from '../constants/keys';
import UserPreferences from './userPreferences';
import database from '../database';
import log from './helpers/log';

export const migrateTokenKeysToServerScoped = async (): Promise<void> => {
	try {
		if (UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)) {
			return;
		}
		const serversDB = database.servers;
		const servers = await serversDB.get('servers').query().fetch();

		const serverUserIds: { server: string; userId: string }[] = [];
		const serverCountByUserId: Record<string, number> = {};
		for (let i = 0; i < servers.length; i += 1) {
			const server = servers[i].id;
			const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
			if (!userId) {
				continue;
			}
			serverUserIds.push({ server, userId });
			serverCountByUserId[userId] = (serverCountByUserId[userId] || 0) + 1;
		}

		const legacyKeys = new Set<string>();
		for (let i = 0; i < serverUserIds.length; i += 1) {
			const { server, userId } = serverUserIds[i];
			const legacyKey = `${TOKEN_KEY}-${userId}`;
			// A userId claimed by more than one server is ambiguous: drop the legacy slot instead of
			// migrating it, so the session re-authenticates.
			if (serverCountByUserId[userId] > 1) {
				legacyKeys.add(legacyKey);
				continue;
			}
			const newKey = getUserTokenKey(server, userId);
			if (!UserPreferences.getString(newKey)) {
				const token = UserPreferences.getString(legacyKey);
				if (token) {
					UserPreferences.setString(newKey, token);
					legacyKeys.add(legacyKey);
				}
			}
		}
		legacyKeys.forEach(key => UserPreferences.removeItem(key));
		UserPreferences.setBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED, true);
	} catch (e) {
		log(e);
	}
};
