jest.mock('~/lib/methods/getPermissions', () => ({
	getPermissions: jest.fn()
}));

jest.mock('~/lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isOmnichannelStatusAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => false)
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
		host: 'https://a.rocket.chat',
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

import loginRoot from '../login';
import { loginRequest, loginSuccess, setUser } from '~/actions/login';
import { LOGIN, LOGOUT } from '~/actions/actionsTypes';
import { localAuthenticate } from '~/lib/methods/helpers/localAuthentication';
import { login } from '~/lib/services/connect';
import { selectServerRequest, selectServerSuccess } from '~/actions/server';
import UserPreferences from '~/lib/methods/userPreferences';
import { CURRENT_SERVER, TOKEN_KEY, getUserTokenKey } from '~/lib/constants/keys';
import { getPermissions } from '~/lib/methods/getPermissions';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { RecordingStore } from '~/lib/testUtils/sagaStore';

const setupStore = (): RecordingStore => createRecordingStore(loginRoot);

afterEach(cancelSagaTasks);

const SERVER_A = 'https://a.rocket.chat';
const SERVER_B = 'https://b.rocket.chat';
const USER_B = { id: 'user-b', token: 'token-b', username: 'userb', name: 'User B' };

describe('login saga — a workspace switch cancels the login bootstrap', () => {
	beforeEach(() => {
		UserPreferences.removeItem(`${TOKEN_KEY}-${SERVER_A}`);
		UserPreferences.removeItem(getUserTokenKey(SERVER_A, USER_B.id));
		UserPreferences.removeItem(CURRENT_SERVER);
		jest.clearAllMocks();
	});

	it('does not persist the credentials when SELECT_REQUEST arrives before the token write', async () => {
		let releasePermissions = () => {};
		jest.mocked(getPermissions).mockImplementation(
			() =>
				new Promise<void>(resolve => {
					releasePermissions = resolve;
				}) as any
		);

		const { store } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginSuccess(USER_B, SERVER_A));
		await flushSagaMicrotasks();

		expect(getPermissions).toHaveBeenCalled();

		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		await flushSagaMicrotasks();

		releasePermissions();
		await flushSagaMicrotasks();

		expect(UserPreferences.getString(`${TOKEN_KEY}-${SERVER_A}`)).toBeNull();
		expect(UserPreferences.getString(getUserTokenKey(SERVER_A, USER_B.id))).toBeNull();
		expect(UserPreferences.getString(CURRENT_SERVER)).toBeNull();
	});

	it('persists the credentials when no switch interrupts the bootstrap', async () => {
		jest.mocked(getPermissions).mockResolvedValue(undefined as any);

		const { store } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginSuccess(USER_B, SERVER_A));
		await flushSagaMicrotasks();

		expect(UserPreferences.getString(`${TOKEN_KEY}-${SERVER_A}`)).toBe(USER_B.id);
		expect(UserPreferences.getString(getUserTokenKey(SERVER_A, USER_B.id))).toBe(USER_B.token);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_A);
	});
});

describe('login saga — a login that answers after a workspace switch', () => {
	const answerLoginLater = () => {
		let answer: (user: typeof USER_B) => void = () => {};
		jest.mocked(login).mockImplementation(
			() =>
				new Promise(resolve => {
					answer = resolve;
				}) as any
		);
		return (user: typeof USER_B) => answer(user);
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(getPermissions).mockResolvedValue(undefined as any);
	});

	it("drops the previous workspace's login result instead of signing in with it", async () => {
		const answer = answerLoginLater();
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginRequest({ resume: USER_B.token }));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		answer(USER_B);
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(action => action.type)).not.toContain(LOGIN.SUCCESS);
		expect(store.getState().login.user.token).toBeUndefined();
		expect(store.getState().login.isFetching).toBe(false);
	});

	it('signs in on the workspace the login started on when no switch happens', async () => {
		const answer = answerLoginLater();
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginRequest({ resume: USER_B.token }));
		await flushSagaMicrotasks();
		answer(USER_B);
		await flushSagaMicrotasks();

		expect(dispatchedActions).toEqual(
			expect.arrayContaining([expect.objectContaining({ type: LOGIN.SUCCESS, server: SERVER_A })])
		);
		expect(store.getState().login.signedInServer).toBe(SERVER_A);
	});

	it('drops the login when the workspace changes while the app waits to be unlocked', async () => {
		jest.mocked(login).mockResolvedValue(USER_B as any);
		let unlock: () => void = () => {};
		jest.mocked(localAuthenticate).mockImplementation(
			() =>
				new Promise<void>(resolve => {
					unlock = resolve;
				}) as any
		);
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginRequest({ resume: USER_B.token }));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		unlock();
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(action => action.type)).not.toContain(LOGIN.SUCCESS);
		expect(store.getState().login.isAuthenticated).toBe(false);
		expect(store.getState().login.user.token).toBeUndefined();
	});

	it('signs in after the unlock when the workspace stays the same', async () => {
		jest.mocked(login).mockResolvedValue(USER_B as any);
		jest.mocked(localAuthenticate).mockResolvedValue(undefined as any);
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginRequest({ resume: USER_B.token }));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(action => action.type)).toContain(LOGIN.SUCCESS);
	});
});

describe('login saga — a login that fails after a workspace switch', () => {
	const rejectLoginLater = () => {
		let reject: (error: unknown) => void = () => {};
		jest.mocked(login).mockImplementation(
			() =>
				new Promise((_resolve, rejectLogin) => {
					reject = rejectLogin;
				}) as any
		);
		return (error: unknown) => reject(error);
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not sign out of the newly selected workspace when the previous workspace rejects the token', async () => {
		const reject = rejectLoginLater();
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));
		store.dispatch(setUser({ id: USER_B.id }));

		store.dispatch(loginRequest({ resume: USER_B.token }));
		await flushSagaMicrotasks();
		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		reject({ status: 401 });
		await flushSagaMicrotasks();

		const types = dispatchedActions.map(action => action.type);
		expect(types).not.toContain(LOGOUT);
		expect(types).not.toContain(LOGIN.FAILURE);
		expect(types).toContain(LOGIN.CANCEL);
		expect(store.getState().login.isFetching).toBe(false);
	});

	it('signs out when the selected workspace rejects the token', async () => {
		const reject = rejectLoginLater();
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));
		store.dispatch(setUser({ id: USER_B.id }));

		store.dispatch(loginRequest({ resume: USER_B.token }));
		await flushSagaMicrotasks();
		reject({ status: 401 });
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(action => action.type)).toContain(LOGOUT);
	});
});
