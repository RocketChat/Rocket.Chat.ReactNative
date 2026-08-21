jest.mock('../database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: jest.fn(),
			write: jest.fn((block: () => unknown) => Promise.resolve(block())),
			batch: jest.fn()
		}
	},
	getDatabase: jest.fn()
}));

jest.mock('./helpers/log', () => ({
	...jest.requireActual('./helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../notifications', () => ({
	getDeviceToken: jest.fn(() => '')
}));

jest.mock('../services/connect', () => ({
	disconnect: jest.fn()
}));

jest.mock('../services/restApi', () => ({
	removePushToken: jest.fn()
}));

import { removeServerData } from './logout';
import database from '../database';
import UserPreferences from './userPreferences';
import { BASIC_AUTH_KEY } from './helpers/fetch';
import { CURRENT_SERVER, E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY, TOKEN_KEY } from '../constants/keys';

const SERVER = 'https://a.rocket.chat';
const OTHER_SERVER = 'https://b.rocket.chat';
const USER_ID = 'user-a';
const OTHER_USER_ID = 'user-b';

const serverKeys = (server: string) => [
	`${BASIC_AUTH_KEY}-${server}`,
	`${server}-${E2E_PUBLIC_KEY}`,
	`${server}-${E2E_PRIVATE_KEY}`,
	`${server}-${E2E_RANDOM_PASSWORD_KEY}`
];

const keysToClear = [
	...serverKeys(SERVER),
	...serverKeys(OTHER_SERVER),
	`${TOKEN_KEY}-${SERVER}`,
	`${TOKEN_KEY}-${OTHER_SERVER}`,
	`${TOKEN_KEY}-${USER_ID}`,
	`${TOKEN_KEY}-${OTHER_USER_ID}`,
	CURRENT_SERVER
];

function seedServer(server: string, userId?: string) {
	if (userId) {
		UserPreferences.setString(`${TOKEN_KEY}-${server}`, userId);
		UserPreferences.setString(`${TOKEN_KEY}-${userId}`, `token-${userId}`);
	}
	serverKeys(server).forEach(key => UserPreferences.setString(key, `value-for-${key}`));
}

function seedServersDBWithServer() {
	const serverRecord = { prepareDestroyPermanently: jest.fn(() => ({})) };
	jest.mocked(database.servers.get).mockReturnValue({ find: jest.fn(() => Promise.resolve(serverRecord)) } as any);
}

describe('removeServerData', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		keysToClear.forEach(key => UserPreferences.removeItem(key));
		seedServersDBWithServer();
	});

	it('clears every per-server key for the removed server', async () => {
		seedServer(SERVER, USER_ID);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(`${TOKEN_KEY}-${SERVER}`)).toBeNull();
		expect(UserPreferences.getString(`${TOKEN_KEY}-${USER_ID}`)).toBeNull();
		serverKeys(SERVER).forEach(key => expect(UserPreferences.getString(key)).toBeNull());
	});

	it('leaves another workspace keys untouched', async () => {
		seedServer(SERVER, USER_ID);
		seedServer(OTHER_SERVER, OTHER_USER_ID);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(`${TOKEN_KEY}-${OTHER_SERVER}`)).toBe(OTHER_USER_ID);
		expect(UserPreferences.getString(`${TOKEN_KEY}-${OTHER_USER_ID}`)).toBe(`token-${OTHER_USER_ID}`);
		serverKeys(OTHER_SERVER).forEach(key => expect(UserPreferences.getString(key)).toBe(`value-for-${key}`));
	});

	it('leaves CURRENT_SERVER in place', async () => {
		seedServer(SERVER, USER_ID);
		UserPreferences.setString(CURRENT_SERVER, SERVER);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER);
	});

	it('skips the user token key when the server has no stored userId', async () => {
		seedServer(SERVER);
		UserPreferences.setString(`${TOKEN_KEY}-${USER_ID}`, `token-${USER_ID}`);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(`${TOKEN_KEY}-${USER_ID}`)).toBe(`token-${USER_ID}`);
		serverKeys(SERVER).forEach(key => expect(UserPreferences.getString(key)).toBeNull());
	});
});
