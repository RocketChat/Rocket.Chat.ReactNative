import type * as SdkIntegration from '../testUtils/sdkIntegration';

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

const mockSdkLogout = jest.fn();

jest.mock('../services/sdk', () => {
	const { makeSdkMock } = jest.requireActual<typeof SdkIntegration>('../testUtils/sdkIntegration');
	return { __esModule: true, default: makeSdkMock({ logout: () => mockSdkLogout() }) };
});

import { logout, removeServerData } from './logout';
import { useRoutingConfigStore } from '../hooks/useCanReturnQueue';
import sdk from '../services/sdk';
import { disconnect } from '../services/connect';
import database from '../database';
import UserPreferences from './userPreferences';
import { BASIC_AUTH_KEY } from './helpers/fetch';
import {
	CERTIFICATE_KEY,
	CURRENT_SERVER,
	E2E_PRIVATE_KEY,
	E2E_PUBLIC_KEY,
	E2E_RANDOM_PASSWORD_KEY,
	TOKEN_KEY
} from '../constants/keys';

const mockSdk = sdk as unknown as SdkIntegration.IMockSdk;

const SERVER = 'https://a.rocket.chat';
const OTHER_SERVER = 'https://b.rocket.chat';
const USER_ID = 'user-a';
const OTHER_USER_ID = 'user-b';

const tokenKey = (suffix: string): string => `${TOKEN_KEY}-${suffix}`;
const certificateKey = (server: string): string => `${CERTIFICATE_KEY}-${server}`;

const serverKeys = (server: string): string[] => [
	`${BASIC_AUTH_KEY}-${server}`,
	`${server}-${E2E_PUBLIC_KEY}`,
	`${server}-${E2E_PRIVATE_KEY}`,
	`${server}-${E2E_RANDOM_PASSWORD_KEY}`
];

const keysToClear = [
	...serverKeys(SERVER),
	...serverKeys(OTHER_SERVER),
	tokenKey(SERVER),
	tokenKey(OTHER_SERVER),
	tokenKey(USER_ID),
	tokenKey(OTHER_USER_ID),
	certificateKey(SERVER),
	CURRENT_SERVER
];

function seedServer(server: string, userId?: string): void {
	if (userId) {
		UserPreferences.setString(tokenKey(server), userId);
		UserPreferences.setString(tokenKey(userId), `token-${userId}`);
	}
	serverKeys(server).forEach(key => UserPreferences.setString(key, `value-for-${key}`));
}

function mockDestroyableServerRecord(): void {
	const serverRecord = { prepareDestroyPermanently: jest.fn(() => ({})) };
	jest.mocked(database.servers.get).mockReturnValue({ find: jest.fn(() => Promise.resolve(serverRecord)) } as any);
}

describe('removeServerData', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		keysToClear.forEach(key => UserPreferences.removeItem(key));
		mockDestroyableServerRecord();
	});

	it('clears every per-server key for the removed server', async () => {
		seedServer(SERVER, USER_ID);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(tokenKey(SERVER))).toBeNull();
		expect(UserPreferences.getString(tokenKey(USER_ID))).toBeNull();
		serverKeys(SERVER).forEach(key => expect(UserPreferences.getString(key)).toBeNull());
	});

	it('leaves another workspace keys untouched', async () => {
		seedServer(SERVER, USER_ID);
		seedServer(OTHER_SERVER, OTHER_USER_ID);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(tokenKey(OTHER_SERVER))).toBe(OTHER_USER_ID);
		expect(UserPreferences.getString(tokenKey(OTHER_USER_ID))).toBe(`token-${OTHER_USER_ID}`);
		serverKeys(OTHER_SERVER).forEach(key => expect(UserPreferences.getString(key)).toBe(`value-for-${key}`));
	});

	it('leaves CURRENT_SERVER in place', async () => {
		seedServer(SERVER, USER_ID);
		UserPreferences.setString(CURRENT_SERVER, SERVER);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER);
	});

	it('keeps the pinned certificate so the user does not have to re-enter its password', async () => {
		seedServer(SERVER, USER_ID);
		UserPreferences.setString(certificateKey(SERVER), 'client-certificate');

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(certificateKey(SERVER))).toBe('client-certificate');
	});

	it('skips the user token key when the server has no stored userId', async () => {
		seedServer(SERVER);
		UserPreferences.setString(tokenKey(USER_ID), `token-${USER_ID}`);

		await removeServerData({ server: SERVER });

		expect(UserPreferences.getString(tokenKey(USER_ID))).toBe(`token-${USER_ID}`);
		serverKeys(SERVER).forEach(key => expect(UserPreferences.getString(key)).toBeNull());
	});
});

describe('logout', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		keysToClear.forEach(key => UserPreferences.removeItem(key));
		mockDestroyableServerRecord();
		mockSdk.setClient(null);
	});

	it('skips the server-side logout when there is no client', async () => {
		seedServer(SERVER, USER_ID);

		await logout({ server: SERVER });

		expect(mockSdkLogout).not.toHaveBeenCalled();
		expect(disconnect).not.toHaveBeenCalled();
	});

	it('clears the local logout state when there is no client', async () => {
		seedServer(SERVER, USER_ID);
		UserPreferences.setString(CURRENT_SERVER, SERVER);

		await logout({ server: SERVER });

		expect(UserPreferences.getString(CURRENT_SERVER)).toBeNull();
		expect(UserPreferences.getString(tokenKey(SERVER))).toBeNull();
		serverKeys(SERVER).forEach(key => expect(UserPreferences.getString(key)).toBeNull());
	});

	it('calls the server-side logout when a client exists', async () => {
		seedServer(SERVER, USER_ID);
		mockSdk.setClient({ host: SERVER });

		await logout({ server: SERVER });

		expect(mockSdkLogout).toHaveBeenCalled();
		expect(disconnect).toHaveBeenCalled();
	});

	it('resets the routing config cache', async () => {
		seedServer(SERVER, USER_ID);
		useRoutingConfigStore.setState({ server: SERVER, returnQueue: true });

		await logout({ server: SERVER });

		expect(useRoutingConfigStore.getState().server).toBeNull();
		expect(useRoutingConfigStore.getState().returnQueue).toBe(false);
	});
});
