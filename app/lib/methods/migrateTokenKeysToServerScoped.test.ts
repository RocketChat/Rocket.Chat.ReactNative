import { migrateTokenKeysToServerScoped } from './migrateTokenKeysToServerScoped';
import UserPreferences from './userPreferences';
import database from '../database';
import log from './helpers/log';
import { TOKEN_KEY, TOKEN_KEY_SERVER_SCOPED_MIGRATED, getUserTokenKey } from '../constants/keys';

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: jest.fn()
		}
	}
}));

jest.mock('./helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockedFetch = jest.fn();

// Configure which server records `database.servers.get('servers').query().fetch()` resolves to.
const setServers = (serverIds: string[]) => {
	mockedFetch.mockResolvedValue(serverIds.map(id => ({ id })));
	jest.mocked(database.servers.get).mockReturnValue({
		query: () => ({ fetch: mockedFetch })
	} as any);
};

describe('migrateTokenKeysToServerScoped', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		UserPreferences.clearAll();
	});

	it('is a no-op when the migration flag is already set', async () => {
		UserPreferences.setBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED, true);
		setServers(['https://open.rocket.chat']);

		await migrateTokenKeysToServerScoped();

		expect(database.servers.get).not.toHaveBeenCalled();
	});

	it('migrates the legacy token to the server-scoped slot and drops the legacy slot', async () => {
		const server = 'https://open.rocket.chat';
		const userId = 'user1';
		UserPreferences.setString(`${TOKEN_KEY}-${server}`, userId);
		UserPreferences.setString(`${TOKEN_KEY}-${userId}`, 'the-token');
		setServers([server]);

		await migrateTokenKeysToServerScoped();

		expect(UserPreferences.getString(getUserTokenKey(server, userId))).toBe('the-token');
		expect(UserPreferences.getString(`${TOKEN_KEY}-${userId}`)).toBeNull();
		expect(UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)).toBe(true);
	});

	it('drops the legacy slot without migrating when the userId is shared by multiple servers', async () => {
		const serverA = 'https://a.rocket.chat';
		const serverB = 'https://b.rocket.chat';
		const userId = 'shared';
		UserPreferences.setString(`${TOKEN_KEY}-${serverA}`, userId);
		UserPreferences.setString(`${TOKEN_KEY}-${serverB}`, userId);
		UserPreferences.setString(`${TOKEN_KEY}-${userId}`, 'ambiguous-token');
		setServers([serverA, serverB]);

		await migrateTokenKeysToServerScoped();

		expect(UserPreferences.getString(`${TOKEN_KEY}-${userId}`)).toBeNull();
		expect(UserPreferences.getString(getUserTokenKey(serverA, userId))).toBeNull();
		expect(UserPreferences.getString(getUserTokenKey(serverB, userId))).toBeNull();
		expect(UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)).toBe(true);
	});

	it('does not overwrite an existing server-scoped token', async () => {
		const server = 'https://open.rocket.chat';
		const userId = 'user1';
		UserPreferences.setString(`${TOKEN_KEY}-${server}`, userId);
		UserPreferences.setString(`${TOKEN_KEY}-${userId}`, 'legacy-token');
		UserPreferences.setString(getUserTokenKey(server, userId), 'existing-token');
		setServers([server]);

		await migrateTokenKeysToServerScoped();

		expect(UserPreferences.getString(getUserTokenKey(server, userId))).toBe('existing-token');
		expect(UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)).toBe(true);
	});

	it('skips servers that have no stored userId', async () => {
		const server = 'https://open.rocket.chat';
		setServers([server]);

		await migrateTokenKeysToServerScoped();

		expect(UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)).toBe(true);
	});

	it('logs and swallows errors instead of throwing, leaving the flag unset', async () => {
		const error = new Error('db exploded');
		mockedFetch.mockRejectedValue(error);
		jest.mocked(database.servers.get).mockReturnValue({
			query: () => ({ fetch: mockedFetch })
		} as any);

		await expect(migrateTokenKeysToServerScoped()).resolves.toBeUndefined();

		expect(log).toHaveBeenCalledWith(error);
		expect(UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)).toBeNull();
	});
});
