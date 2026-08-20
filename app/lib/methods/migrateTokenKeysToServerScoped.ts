import {
	TOKEN_KEY,
	TOKEN_KEY_SERVER_SCOPED_MIGRATED,
	getLegacyUserTokenKey,
	getServerUserIdKey,
	getUserTokenKey
} from '../constants/keys';
import UserPreferences from './userPreferences';
import database from '../database';
import log from './helpers/log';

const isLegacyUserTokenKey = (key: string): boolean => key.startsWith(`${TOKEN_KEY}-`) && !key.includes('://');

export const migrateTokenKeysToServerScoped = async (): Promise<void> => {
	try {
		if (UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)) {
			return;
		}
		const serversDB = database.servers;
		const servers = await serversDB.get('servers').query().fetch();

		const serversByUserId = new Map<string, string[]>();
		for (let i = 0; i < servers.length; i += 1) {
			const server = servers[i].id;
			const userId = UserPreferences.getString(getServerUserIdKey(server));
			if (!userId) {
				continue;
			}
			const sharing = serversByUserId.get(userId);
			if (sharing) {
				sharing.push(server);
			} else {
				serversByUserId.set(userId, [server]);
			}
		}

		serversByUserId.forEach((sharing, userId) => {
			const legacyKey = getLegacyUserTokenKey(userId);
			// A userId claimed by more than one server is ambiguous: drop the legacy slot instead of
			// migrating it, so the session re-authenticates.
			if (sharing.length > 1) {
				UserPreferences.removeItem(legacyKey);
				return;
			}
			const newKey = getUserTokenKey(sharing[0], userId);
			const token = UserPreferences.getString(legacyKey);
			if (token && !UserPreferences.getString(newKey)) {
				UserPreferences.setString(newKey, token);
			}
			UserPreferences.removeItem(legacyKey);
		});

		// Legacy slots whose server has no row left in the database are unreachable above, and the
		// migrated flag stops the native fallbacks from reading them. Drop them instead of stranding them.
		UserPreferences.getAllKeys()
			.filter(isLegacyUserTokenKey)
			.forEach(key => UserPreferences.removeItem(key));

		UserPreferences.setBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED, true);
	} catch (e) {
		log(e);
	}
};
