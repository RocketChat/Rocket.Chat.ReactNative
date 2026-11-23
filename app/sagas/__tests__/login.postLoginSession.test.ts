jest.mock('~/lib/methods/getPermissions', () => ({
	getPermissions: jest.fn()
}));

jest.mock('~/lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isOmnichannelStatusAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => true)
}));

jest.mock('~/lib/methods/getCustomEmojis', () => ({
	getCustomEmojis: jest.fn()
}));

jest.mock('~/lib/methods/getRoles', () => ({
	getRoles: jest.fn()
}));

jest.mock('~/lib/methods/getSlashCommands', () => ({
	getSlashCommands: jest.fn()
}));

jest.mock('~/lib/methods/getSettings', () => ({
	subscribeSettings: jest.fn()
}));

jest.mock('~/lib/methods/getUsersPresence', () => ({
	getUserPresence: jest.fn(),
	refreshDmUsersPresence: jest.fn(),
	subscribeUsersPresence: jest.fn()
}));

jest.mock('~/lib/services/restApi', () => ({
	getUsersRoles: jest.fn(() => []),
	registerPushToken: jest.fn(),
	saveUserProfile: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('~/lib/services/connect', () => ({
	disconnect: jest.fn(),
	login: jest.fn(),
	loginWithPassword: jest.fn()
}));

jest.mock('~/lib/methods/logout', () => ({
	logout: jest.fn(),
	removeServerData: jest.fn(),
	removeServerDatabase: jest.fn()
}));

jest.mock('~/lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { init: jest.fn(), reset: jest.fn() }
}));

jest.mock('~/lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));

jest.mock('~/lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('~/lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: { client: { host: '' } },
		subscribe: jest.fn()
	}
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: { get: jest.fn() },
		servers: {
			get: jest.fn(() => ({
				find: jest.fn(() => Promise.reject(new Error('not found'))),
				create: jest.fn(),
				schema: {}
			})),
			write: jest.fn(async (block: () => Promise<void>) => block())
		}
	}
}));

jest.mock('~/lib/methods/helpers/hasPermission', () => ({
	hasPermission: jest.fn(() => Promise.resolve([true, false]))
}));

let mockStore: Store | null = null;
jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => mockStore?.getState() }
}));

import type { Store } from 'redux';

import loginRoot from '../login';
import { loginSuccess, logout } from '~/actions/login';
import { setPermissions } from '~/actions/permissions';
import { selectServerRequest, selectServerSuccess } from '~/actions/server';
import UserPreferences from '~/lib/methods/userPreferences';
import { CURRENT_SERVER, getUserTokenKey } from '~/lib/constants/keys';
import { getPermissions } from '~/lib/methods/getPermissions';
import { mediaSessionInstance } from '~/lib/services/voip/MediaSessionInstance';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';

const SERVER_A = 'https://a.rocket.chat';
const SERVER_B = 'https://b.rocket.chat';
const USER = { id: 'user-a', token: 'token-a', username: 'usera', name: 'User A' };

const holdPermissionsFetch = () => {
	let release = () => {};
	jest.mocked(getPermissions).mockImplementation(
		() =>
			new Promise<void>(resolve => {
				release = resolve;
			}) as any
	);
	return () => release();
};

const startLoggedInStore = () => {
	const { store } = createRecordingStore(loginRoot);
	mockStore = store;
	store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));
	return { store };
};

const persistedToken = () => UserPreferences.getString(getUserTokenKey(SERVER_A, USER.id));

afterEach(() => {
	cancelSagaTasks();
	mockStore = null;
});

describe('login saga — post-login session', () => {
	beforeEach(() => {
		UserPreferences.removeItem(getUserTokenKey(SERVER_A, USER.id));
		UserPreferences.removeItem(CURRENT_SERVER);
		jest.clearAllMocks();
		jest.mocked(getPermissions).mockResolvedValue(undefined as any);
	});

	it('runs the post-login work for a second login that arrives right after the first', async () => {
		const { store } = startLoggedInStore();

		store.dispatch(loginSuccess(USER));
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();

		expect(getPermissions).toHaveBeenCalledTimes(2);
		expect(persistedToken()).toBe(USER.token);
	});

	it('keeps exactly one VoIP watcher across logins', async () => {
		jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
		try {
			const { store } = startLoggedInStore();

			store.dispatch(loginSuccess(USER));
			await flushSagaMicrotasks();
			await jest.advanceTimersByTimeAsync(3000);
			store.dispatch(loginSuccess(USER));
			await flushSagaMicrotasks();
			jest.mocked(mediaSessionInstance.init).mockClear();

			store.dispatch(setPermissions({}));
			await flushSagaMicrotasks();

			expect(mediaSessionInstance.init).toHaveBeenCalledTimes(1);
		} finally {
			jest.useRealTimers();
		}
	});

	it('finishes the post-login work when the same workspace is selected mid-login', async () => {
		const releasePermissions = holdPermissionsFetch();
		const { store } = startLoggedInStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER_A, '7.0.0'));
		await flushSagaMicrotasks();
		releasePermissions();
		await flushSagaMicrotasks();

		expect(persistedToken()).toBe(USER.token);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_A);
	});

	it('cancels the post-login work when another workspace is selected mid-login', async () => {
		const releasePermissions = holdPermissionsFetch();
		const { store } = startLoggedInStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		await flushSagaMicrotasks();
		releasePermissions();
		await flushSagaMicrotasks();

		expect(persistedToken()).toBeNull();
	});

	it('cancels the post-login work and the VoIP watcher on logout', async () => {
		const releasePermissions = holdPermissionsFetch();
		const { store } = startLoggedInStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(logout());
		await flushSagaMicrotasks();
		releasePermissions();
		jest.mocked(mediaSessionInstance.init).mockClear();
		store.dispatch(setPermissions({}));
		await flushSagaMicrotasks();

		expect(persistedToken()).toBeNull();
		expect(mediaSessionInstance.init).not.toHaveBeenCalled();
	});
});
