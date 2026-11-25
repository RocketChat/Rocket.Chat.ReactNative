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

jest.mock('~/lib/database/services/Server', () => ({
	getServerById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('~/containers/ActionSheet/Provider', () => ({
	showActionSheetRef: jest.fn()
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	getIsMasterDetail: jest.fn(() => false)
}));

let mockStore: Store | null = null;
jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: () => mockStore?.getState() }
}));

import type { Store } from 'redux';

import loginRoot from '../login';
import { deleteAccount, loginSuccess, logout, setUser } from '~/actions/login';
import { setPermissions } from '~/actions/permissions';
import { setSupportedVersions } from '~/actions/supportedVersions';
import { showActionSheetRef } from '~/containers/ActionSheet/Provider';
import { getServerById } from '~/lib/database/services/Server';
import type { TServerModel } from '~/definitions/IServer';
import { connectRequest } from '~/actions/connect';
import { selectServerCancel, selectServerRequest, selectServerSuccess } from '~/actions/server';
import UserPreferences from '~/lib/methods/userPreferences';
import { CURRENT_SERVER, getServerUserIdKey, getUserTokenKey } from '~/lib/constants/keys';
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
			})
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
		UserPreferences.removeItem(getServerUserIdKey(SERVER_A));
		UserPreferences.removeItem(getUserTokenKey(SERVER_A, USER.id));
		UserPreferences.removeItem(CURRENT_SERVER);
		jest.clearAllMocks();
		jest.mocked(getPermissions).mockResolvedValue(undefined);
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
		const { store } = startLoggedInStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		jest.mocked(mediaSessionInstance.init).mockClear();

		store.dispatch(setPermissions({}));
		await flushSagaMicrotasks();

		expect(mediaSessionInstance.init).toHaveBeenCalledTimes(1);
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

		expect(UserPreferences.getString(getServerUserIdKey(SERVER_A))).toBe(USER.id);
		expect(persistedToken()).toBe(USER.token);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_A);
	});

	it.each([
		['logout', logout],
		['account deletion', deleteAccount],
		['a switch to another workspace', () => selectServerRequest(SERVER_B, '7.0.0')]
	])('cancels the post-login work and the VoIP watcher on %s', async (_, endSession) => {
		const releasePermissions = holdPermissionsFetch();
		const { store } = startLoggedInStore();

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(endSession());
		await flushSagaMicrotasks();
		releasePermissions();
		jest.mocked(mediaSessionInstance.init).mockClear();
		store.dispatch(setPermissions({}));
		await flushSagaMicrotasks();

		expect(UserPreferences.getString(getServerUserIdKey(SERVER_A))).toBeNull();
		expect(persistedToken()).toBeNull();
		expect(UserPreferences.getString(CURRENT_SERVER)).toBeNull();
		expect(mediaSessionInstance.init).not.toHaveBeenCalled();
	});

	const switchAwayAndBack = (store: Store) => {
		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		store.dispatch(selectServerRequest(SERVER_A, '7.0.0'));
		store.dispatch(selectServerCancel());
	};

	const voipRechecks = async (store: Store) => {
		jest.mocked(mediaSessionInstance.init).mockClear();
		store.dispatch(setPermissions({}));
		await flushSagaMicrotasks();
		return jest.mocked(mediaSessionInstance.init).mock.calls.length > 0;
	};

	it('restarts the post-login work when the workspace is selected again before the switch connects', async () => {
		const { store } = startLoggedInStore();
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		UserPreferences.removeItem(getUserTokenKey(SERVER_A, USER.id));
		jest.mocked(getPermissions).mockClear();

		switchAwayAndBack(store);
		await flushSagaMicrotasks();

		expect(getPermissions).toHaveBeenCalledTimes(1);
		expect(persistedToken()).toBe(USER.token);
		expect(store.getState().login.user.id).toBe(USER.id);
		expect(await voipRechecks(store)).toBe(true);
	});

	it('restarts with the current user, keeping profile changes made since login and during the switch', async () => {
		const { store } = startLoggedInStore();
		store.dispatch(loginSuccess({ ...USER, status: 'online', language: 'en' }));
		await flushSagaMicrotasks();
		store.dispatch(setUser({ language: 'pt-BR' }));

		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		store.dispatch(setUser({ status: 'busy' }));
		store.dispatch(selectServerRequest(SERVER_A, '7.0.0'));
		store.dispatch(selectServerCancel());
		await flushSagaMicrotasks();

		expect(store.getState().login.user).toMatchObject({
			id: USER.id,
			username: USER.username,
			status: 'busy',
			language: 'pt-BR'
		});
	});

	it.each([
		['the other workspace starts connecting', () => connectRequest()],
		['the user logs out', () => logout()],
		['the account is deleted', () => deleteAccount()]
	])('does not restart the post-login work after %s', async (_, interrupt) => {
		const { store } = startLoggedInStore();
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		jest.mocked(getPermissions).mockClear();

		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		store.dispatch(interrupt());
		store.dispatch(selectServerRequest(SERVER_A, '7.0.0'));
		store.dispatch(selectServerCancel());
		await flushSagaMicrotasks();

		expect(getPermissions).not.toHaveBeenCalled();
		expect(await voipRechecks(store)).toBe(false);
	});

	it('does not restart the post-login work when another workspace is selected again', async () => {
		const { store } = startLoggedInStore();
		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		jest.mocked(getPermissions).mockClear();

		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		store.dispatch(selectServerCancel());
		await flushSagaMicrotasks();

		expect(getPermissions).not.toHaveBeenCalled();
		expect(await voipRechecks(store)).toBe(false);
	});

	it('shows the supported-versions warning even when the session ends while its timestamp is saved', async () => {
		let releaseWarningTimestamp = () => {};
		jest.mocked(getServerById).mockResolvedValue({
			supportedVersionsWarningAt: new Date(0),
			update: () =>
				new Promise<void>(resolve => {
					releaseWarningTimestamp = resolve;
				})
		} as unknown as TServerModel);
		const { store } = startLoggedInStore();
		store.dispatch(setSupportedVersions({ status: 'warn' }));

		store.dispatch(loginSuccess(USER));
		await flushSagaMicrotasks();
		store.dispatch(logout());
		releaseWarningTimestamp();
		await flushSagaMicrotasks();

		expect(showActionSheetRef).toHaveBeenCalledTimes(1);
	});
});
