// Do not mock '../../lib/methods/userPreferences' here: this test asserts against the real
// MMKV-backed store (__mocks__/react-native-mmkv.js). Mocking it lets the test wire up whichever
// key the code happens to ask for, which is exactly the asymmetry these cases exist to catch.

jest.mock('../../lib/methods/helpers/sslPinning', () => ({
	__esModule: true,
	default: undefined
}));

jest.mock('../../lib/database/services/LoggedUser', () => ({
	getLoggedUserById: jest.fn()
}));

jest.mock('../../lib/database/services/Server', () => ({
	getServerById: jest.fn()
}));

jest.mock('../../lib/methods/getServerInfo', () => ({
	getServerInfo: jest.fn()
}));

jest.mock('../../lib/methods/getSettings', () => ({
	getLoginSettings: jest.fn(),
	setSettings: jest.fn()
}));

jest.mock('../../lib/methods/getCustomEmojis', () => ({
	setCustomEmojis: jest.fn()
}));

jest.mock('../../lib/methods/getPermissions', () => ({
	setPermissions: jest.fn()
}));

jest.mock('../../lib/methods/getRoles', () => ({
	setRoles: jest.fn()
}));

jest.mock('../../lib/methods/enterpriseModules', () => ({
	setEnterpriseModules: jest.fn()
}));

jest.mock('../../lib/methods/checkSupportedVersions', () => ({
	checkSupportedVersions: jest.fn(() => Promise.resolve({ status: 'supported' }))
}));

jest.mock('../../lib/services/connect', () => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(),
	getLoginServices: jest.fn(),
	getWebsocketInfo: jest.fn(() => Promise.resolve({ success: true }))
}));

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: { client: { host: '' } }
	}
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn(),
	logServerVersion: jest.fn()
}));

import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import selectServerRoot from '../selectServer';
import { selectServerRequest } from '../../actions/server';
import { SERVER } from '../../actions/actionsTypes';
import UserPreferences from '../../lib/methods/userPreferences';
import { BASIC_AUTH_KEY, setBasicAuth } from '../../lib/methods/helpers/fetch';
import { CURRENT_SERVER, TOKEN_KEY } from '../../lib/constants/keys';
import { getLoggedUserById } from '../../lib/database/services/LoggedUser';
import { connect } from '../../lib/services/connect';

async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 20; i += 1) {
		await new Promise(resolve => setImmediate(resolve));
	}
}

const OLD_SERVER = 'https://old.rocket.chat';
const SERVER_URL = 'https://new.rocket.chat';
const USER_ID = 'user-new';
const TOKEN = 'token-new';

function setupStore() {
	const dispatched: { type: string }[] = [];
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(
		reducers,
		applyMiddleware(
			() => next => action => {
				dispatched.push(action);
				return next(action);
			},
			sagaMiddleware
		)
	);
	sagaMiddleware.run(selectServerRoot);
	return { store, dispatched };
}

const keysToClear = [`${TOKEN_KEY}-${SERVER_URL}`, `${TOKEN_KEY}-${USER_ID}`, `${BASIC_AUTH_KEY}-${SERVER_URL}`, CURRENT_SERVER];

describe('selectServer saga — resolving the target workspace user', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		keysToClear.forEach(key => UserPreferences.removeItem(key));
		UserPreferences.setString(CURRENT_SERVER, OLD_SERVER);
		setBasicAuth(null);
	});

	it('sets the full user from the logged-user record and stamps CURRENT_SERVER', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: TOKEN, username: 'new' } as any);

		const { store, dispatched } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().login.user).toMatchObject({ id: USER_ID, token: TOKEN });
		expect(dispatched.map(action => action.type)).not.toContain(SERVER.SELECT_FAILURE);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_URL);
	});

	it('falls back to the token stored under the userId key when there is no record', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		UserPreferences.setString(`${TOKEN_KEY}-${USER_ID}`, TOKEN);
		jest.mocked(getLoggedUserById).mockResolvedValue(null as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(store.getState().login.user).toMatchObject({ token: TOKEN });
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(SERVER_URL);
	});

	it('does not stamp CURRENT_SERVER when the target workspace has no credentials', async () => {
		jest.mocked(getLoggedUserById).mockResolvedValue(null as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(getLoggedUserById).not.toHaveBeenCalled();
		expect(store.getState().login.user).toEqual({});
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(OLD_SERVER);
	});

	it('leaves CURRENT_SERVER on the previous workspace when the switch fails', async () => {
		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		jest.mocked(getLoggedUserById).mockRejectedValue(new Error('database unavailable'));

		const { store, dispatched } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(dispatched.map(action => action.type)).toContain(SERVER.SELECT_FAILURE);
		expect(UserPreferences.getString(CURRENT_SERVER)).toBe(OLD_SERVER);
		expect(connect).not.toHaveBeenCalled();
	});

	it('drops the previous workspace basic-auth header when the target has none', async () => {
		setBasicAuth('old-workspace-credentials');
		expect(RocketChatSettings.customHeaders).toHaveProperty('Authorization');

		UserPreferences.setString(`${TOKEN_KEY}-${SERVER_URL}`, USER_ID);
		jest.mocked(getLoggedUserById).mockResolvedValue({ id: USER_ID, token: TOKEN } as any);

		const { store } = setupStore();
		store.dispatch(selectServerRequest(SERVER_URL, '7.0.0', false));
		await flushSagaMicrotasks();

		expect(RocketChatSettings.customHeaders).not.toHaveProperty('Authorization');
	});
});
