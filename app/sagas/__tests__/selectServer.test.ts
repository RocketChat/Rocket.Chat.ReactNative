jest.mock('~/lib/methods/helpers/sslPinning', () => ({
	__esModule: true,
	default: undefined
}));

jest.mock('~/lib/database', () => ({
	active: { get: jest.fn() },
	servers: {
		get: jest.fn(() => ({ query: () => ({ fetch: () => Promise.resolve([{}]) }) })),
		write: (work: () => Promise<unknown>) => work()
	}
}));

jest.mock('~/lib/database/services/LoggedUser', () => ({
	getLoggedUserById: jest.fn()
}));

jest.mock('~/lib/database/services/Server', () => ({
	getServerById: jest.fn()
}));

jest.mock('~/lib/methods/getServerInfo', () => ({
	getServerInfo: jest.fn()
}));

jest.mock('~/lib/methods/getSettings', () => ({
	getLoginSettings: jest.fn(),
	setSettings: jest.fn()
}));

jest.mock('~/lib/methods/getCustomEmojis', () => ({
	setCustomEmojis: jest.fn()
}));

jest.mock('~/lib/methods/getPermissions', () => ({
	setPermissions: jest.fn()
}));

jest.mock('~/lib/methods/getRoles', () => ({
	setRoles: jest.fn()
}));

jest.mock('~/lib/methods/enterpriseModules', () => ({
	setEnterpriseModules: jest.fn()
}));

jest.mock('~/lib/methods/checkSupportedVersions', () => ({
	checkSupportedVersions: jest.fn(() => Promise.resolve({ status: 'supported' }))
}));

jest.mock('~/lib/services/connect', () => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(),
	getLoginServices: jest.fn(),
	getWebsocketInfo: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('~/lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: { client: { host: '' } }
	}
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	...jest.requireActual('~/lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn(),
	logServerVersion: jest.fn()
}));

import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import selectServerRoot from '../selectServer';
import { selectServerRequest, serverRequest } from '~/actions/server';
import { appStart } from '~/actions/app';
import { RootEnum } from '~/definitions';
import { SERVER } from '~/actions/actionsTypes';
import UserPreferences from '~/lib/methods/userPreferences';
import { setBasicAuth } from '~/lib/methods/helpers/fetch';
import { CURRENT_SERVER, TOKEN_KEY, getBasicAuthKey, getUserTokenKey } from '~/lib/constants/keys';
import { getLoggedUserById } from '~/lib/database/services/LoggedUser';
import { getServerInfo } from '~/lib/methods/getServerInfo';
import { getLoginSettings } from '~/lib/methods/getSettings';
import { connect, getLoginServices } from '~/lib/services/connect';
import sdk from '~/lib/services/sdk';
import { getServerById } from '~/lib/database/services/Server';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '~/lib/testUtils/sagaStore';
import type { RecordingStore } from '~/lib/testUtils/sagaStore';

const OLD_SERVER = 'https://old.rocket.chat';
const SERVER_URL = 'https://new.rocket.chat';
const USER_ID = 'user-new';
const TOKEN = 'token-new';

const keysToClear = [
	`${TOKEN_KEY}-${SERVER_URL}`,
	getUserTokenKey(SERVER_URL, USER_ID),
	getBasicAuthKey(SERVER_URL),
	CURRENT_SERVER
];

const setupStore = (): RecordingStore => createRecordingStore(selectServerRoot);

afterEach(cancelSagaTasks);

beforeEach(() => {
	jest.clearAllMocks();
	keysToClear.forEach(key => UserPreferences.removeItem(key));
	UserPreferences.setString(CURRENT_SERVER, OLD_SERVER);
	setBasicAuth(null);
});

describe('selectServer saga — resolving the target workspace user', () => {
	it('sets the full user from the logged-user record and stamps CURRENT_SERVER', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: TOKEN, username: 'new' } as any);

		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().login.user).toMatchObject({ id: USER_ID, token: TOKEN });
		expect(dispatchedActions.map(action => action.type)).not.toContain(SERVER.SELECT_FAILURE);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_URL);
	});

	it('falls back to the token stored under the server-scoped key when there is no record', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockResolvedValue(null as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().login.user).toEqual({ token: TOKEN });
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_URL);
	});

	it('uses the workspace-scoped token when the cached record holds another workspace token', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: 'token-other-workspace', username: 'new' } as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().login.user.token).toBe(TOKEN);
	});

	it('does not restore the cached record token when the target workspace has no scoped token', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: 'token-other-workspace' } as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(getLoggedUserById).not.toHaveBeenCalled();
		expect(store.getState().login.user).toEqual({});
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(OLD_SERVER);
	});

	it('does not stamp CURRENT_SERVER when the target workspace has no credentials', async () => {
		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(getLoggedUserById).not.toHaveBeenCalled();
		expect(store.getState().login.user).toEqual({});
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(OLD_SERVER);
	});

	it('leaves CURRENT_SERVER on the previous workspace when the switch fails', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockRejectedValue(new Error('database unavailable'));

		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(dispatchedActions.map(action => action.type)).toContain(SERVER.SELECT_FAILURE);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(OLD_SERVER);
		expect(connect).not.toHaveBeenCalled();
	});

	it('drops the previous workspace basic-auth header when the target has none', async () => {
		setBasicAuth('old-workspace-credentials');
		expect(RocketChatSettings.customHeaders).toHaveProperty('Authorization');

		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: TOKEN } as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(RocketChatSettings.customHeaders).not.toHaveProperty('Authorization');
	});
});

describe('selectServer saga — version and name fallback', () => {
	beforeEach(() => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: TOKEN } as any);
	});

	it('reports the caller-supplied version and the default name', async () => {
		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.4.0', false));
		await flushSagaMicrotasks();

		const success = dispatchedActions.find(action => action.type === SERVER.SELECT_SUCCESS);
		expect(success).toMatchObject({ server: SERVER_URL, version: '7.4.0', name: 'Rocket.Chat' });
		expect(getServerInfo).not.toHaveBeenCalled();
	});

	it('reports a server failure and the caller-supplied version when the server info fetch throws', async () => {
		jest.mocked(getServerInfo).mockRejectedValue(new Error('offline'));

		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.4.0', true));
		await flushSagaMicrotasks();

		const types = dispatchedActions.map(action => action.type);
		expect(types).toContain(SERVER.FAILURE);
		expect(types).not.toContain(SERVER.SELECT_FAILURE);

		const success = dispatchedActions.find(action => action.type === SERVER.SELECT_SUCCESS);
		expect(success).toMatchObject({ server: SERVER_URL, version: '7.4.0', name: 'Rocket.Chat' });
	});

	it('reports the stored record version when the server info fetch is unsuccessful', async () => {
		jest.mocked(getServerInfo).mockResolvedValue({ success: false } as any);
		jest.mocked(getServerById).mockResolvedValue({ version: '6.9.0', name: 'Stored A' } as any);

		const { store, dispatchedActions } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.4.0', true));
		await flushSagaMicrotasks();

		const success = dispatchedActions.find(action => action.type === SERVER.SELECT_SUCCESS);
		expect(success).toMatchObject({ server: SERVER_URL, version: '6.9.0', name: 'Stored A' });
	});
});

describe('selectServer saga — user-facing root after a failed switch', () => {
	beforeEach(() => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(getUserTokenKey(SERVER_URL, USER_ID), TOKEN);
		jest.mocked(getLoggedUserById).mockRejectedValue(new Error('database unavailable'));
	});

	it('lands on ROOT_OUTSIDE when the switch fails during boot, before any root is set', async () => {
		const { store } = setupStore();
		expect(store.getState().app.root).toBeUndefined();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('lands on ROOT_OUTSIDE when the switch fails while the app is on the loading root', async () => {
		const { store } = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_LOADING }));
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('lands on ROOT_OUTSIDE when the switch fails while the share sheet is on its loading root', async () => {
		const { store } = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_LOADING_SHARE_EXTENSION }));
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('keeps the current root when the switch fails while the app is already inside', async () => {
		const { store } = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_INSIDE);
	});

	it('keeps the current root when the switch fails while the share sheet is up', async () => {
		const { store } = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_SHARE_EXTENSION }));
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_SHARE_EXTENSION);
	});
});

describe('selectServer saga — requesting a new workspace', () => {
	const REQUESTED_HOST = 'https://attacker.example';
	const authorizationSentToHost: Array<string | null> = [];

	beforeEach(() => {
		authorizationSentToHost.length = 0;
		const recordGlobalAuthorization = async () => {
			authorizationSentToHost.push((RocketChatSettings.customHeaders as { Authorization?: string }).Authorization ?? null);
		};
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '7.0.0' } as any);
		jest
			.mocked(getServerById)
			.mockResolvedValue({ version: '7.0.0', update: async (apply: (r: object) => void) => apply({}) } as any);
		jest.mocked(getLoginServices).mockImplementation(recordGlobalAuthorization);
		jest.mocked(getLoginSettings).mockImplementation(recordGlobalAuthorization);
	});

	afterEach(() => {
		UserPreferences.removeItem(getBasicAuthKey(REQUESTED_HOST));
		UserPreferences.removeItem(getBasicAuthKey(OLD_SERVER));
		(sdk as { host?: string }).host = undefined;
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getLoginServices).mockReset();
		jest.mocked(getLoginSettings).mockReset();
	});

	it('keeps the active workspace basic auth on the shared headers while probing a new host', async () => {
		setBasicAuth('old-workspace-credentials');

		const { store } = setupStore();
		store.dispatch(serverRequest(REQUESTED_HOST));
		await flushSagaMicrotasks();

		expect(authorizationSentToHost).toEqual(['Basic old-workspace-credentials', 'Basic old-workspace-credentials']);
	});

	it('keeps the requested host credentials off the shared headers even when it has its own stored basic auth', async () => {
		UserPreferences.setString(getBasicAuthKey(REQUESTED_HOST), 'requested-host-credentials');

		const { store } = setupStore();
		store.dispatch(serverRequest(REQUESTED_HOST));
		await flushSagaMicrotasks();

		expect(authorizationSentToHost).toEqual([null, null]);
	});

	it('re-applies the connected workspace basic auth when it is selected while the probe is pending', async () => {
		UserPreferences.setString(getBasicAuthKey(OLD_SERVER), 'old-workspace-credentials');
		setBasicAuth('stale-credentials');
		(sdk as { host?: string }).host = OLD_SERVER;
		let resolveProbe!: (value: unknown) => void;
		jest
			.mocked(getServerInfo)
			.mockImplementationOnce(() => new Promise(resolve => (resolveProbe = resolve as (value: unknown) => void)));

		const { store } = setupStore();
		store.dispatch(serverRequest(REQUESTED_HOST));
		await flushSagaMicrotasks();

		store.dispatch(selectServerRequest(OLD_SERVER, '7.0.0', false));
		await flushSagaMicrotasks();

		expect((RocketChatSettings.customHeaders as { Authorization?: string }).Authorization).toBe(
			'Basic old-workspace-credentials'
		);

		resolveProbe({ success: false });
		await flushSagaMicrotasks();

		expect((RocketChatSettings.customHeaders as { Authorization?: string }).Authorization).toBe(
			'Basic old-workspace-credentials'
		);
	});

	it('leaves the active workspace basic auth in place when the requested host cannot be reached', async () => {
		UserPreferences.setString(getBasicAuthKey(OLD_SERVER), 'old-workspace-credentials');
		setBasicAuth('old-workspace-credentials');
		(sdk as { host?: string }).host = OLD_SERVER;
		jest.mocked(getServerInfo).mockResolvedValue({ success: false } as any);

		const { store } = setupStore();
		store.dispatch(serverRequest(REQUESTED_HOST));
		await flushSagaMicrotasks();

		expect((RocketChatSettings.customHeaders as { Authorization?: string }).Authorization).toBe(
			'Basic old-workspace-credentials'
		);
	});

	it('connects to the requested host with its own basic auth after a successful probe', async () => {
		UserPreferences.setString(getBasicAuthKey(OLD_SERVER), 'old-workspace-credentials');
		UserPreferences.setString(getBasicAuthKey(REQUESTED_HOST), 'requested-host-credentials');
		setBasicAuth('old-workspace-credentials');
		(sdk as { host?: string }).host = OLD_SERVER;
		let authorizationAtConnect: string | null = null;
		jest.mocked(connect).mockImplementationOnce(async () => {
			authorizationAtConnect = (RocketChatSettings.customHeaders as { Authorization?: string }).Authorization ?? null;
		});

		const { store } = setupStore();
		store.dispatch(serverRequest(REQUESTED_HOST));
		await flushSagaMicrotasks();

		expect(authorizationAtConnect).toBe('Basic requested-host-credentials');
	});
});
