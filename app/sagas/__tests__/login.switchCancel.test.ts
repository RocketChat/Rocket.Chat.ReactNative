// Do not mock '../../lib/methods/userPreferences' here: this test asserts against the real
// MMKV-backed store (__mocks__/react-native-mmkv.js). Mocking it turns the assertions into
// spy checks and the test stops proving that no credential was persisted.

jest.mock('../../lib/methods/getPermissions', () => ({
	getPermissions: jest.fn()
}));

jest.mock('../../lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isOmnichannelStatusAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => false)
}));

jest.mock('../../lib/methods/getCustomEmojis', () => ({
	getCustomEmojis: jest.fn()
}));

jest.mock('../../lib/methods/getRoles', () => ({
	getRoles: jest.fn()
}));

jest.mock('../../lib/methods/getSlashCommands', () => ({
	getSlashCommands: jest.fn()
}));

jest.mock('../../lib/methods/getSettings', () => ({
	subscribeSettings: jest.fn()
}));

jest.mock('../../lib/methods/getUsersPresence', () => ({
	getUserPresence: jest.fn(),
	refreshDmUsersPresence: jest.fn(),
	subscribeUsersPresence: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	getUsersRoles: jest.fn(() => []),
	registerPushToken: jest.fn(),
	saveUserProfile: jest.fn(),
	setUserPresenceAway: jest.fn()
}));

jest.mock('../../lib/services/connect', () => ({
	disconnect: jest.fn(),
	login: jest.fn(),
	loginWithPassword: jest.fn()
}));

jest.mock('../../lib/methods/logout', () => ({
	logout: jest.fn(),
	removeServerData: jest.fn(),
	removeServerDatabase: jest.fn()
}));

jest.mock('../../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { init: jest.fn(), reset: jest.fn() }
}));

jest.mock('../../lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));

jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: jest.fn(() => false)
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: { client: { host: '' } },
		subscribe: jest.fn()
	}
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../lib/database', () => ({
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

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import loginRoot from '../login';
import { loginSuccess } from '../../actions/login';
import { selectServerRequest, selectServerSuccess } from '../../actions/server';
import UserPreferences from '../../lib/methods/userPreferences';
import { CURRENT_SERVER, TOKEN_KEY } from '../../lib/constants/keys';
import { getPermissions } from '../../lib/methods/getPermissions';

async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 20; i += 1) {
		await new Promise(resolve => setImmediate(resolve));
	}
}

type PreloadedState = Parameters<typeof createStore>[1];

function setupStore(preloadedState?: PreloadedState) {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(loginRoot);
	return store;
}

const SERVER_A = 'https://a.rocket.chat';
const SERVER_B = 'https://b.rocket.chat';
const USER_B = { id: 'user-b', token: 'token-b', username: 'userb', name: 'User B' };

describe('login saga — a workspace switch cancels the login bootstrap', () => {
	beforeEach(() => {
		UserPreferences.removeItem(`${TOKEN_KEY}-${SERVER_A}`);
		UserPreferences.removeItem(`${TOKEN_KEY}-${USER_B.id}`);
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

		const store = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginSuccess(USER_B));
		await flushSagaMicrotasks();

		expect(getPermissions).toHaveBeenCalled();

		store.dispatch(selectServerRequest(SERVER_B, '7.0.0'));
		await flushSagaMicrotasks();

		releasePermissions();
		await flushSagaMicrotasks();

		expect(UserPreferences.getString(`${TOKEN_KEY}-${SERVER_A}`)).toBeNull();
		expect(UserPreferences.getString(`${TOKEN_KEY}-${USER_B.id}`)).toBeNull();
	});

	it('persists the credentials when no switch interrupts the bootstrap', async () => {
		jest.mocked(getPermissions).mockResolvedValue(undefined as any);

		const store = setupStore();
		store.dispatch(selectServerSuccess({ server: SERVER_A, version: '7.0.0', name: 'A' }));

		store.dispatch(loginSuccess(USER_B));
		await flushSagaMicrotasks();

		expect(UserPreferences.getString(`${TOKEN_KEY}-${SERVER_A}`)).toBe(USER_B.id);
		expect(UserPreferences.getString(`${TOKEN_KEY}-${USER_B.id}`)).toBe(USER_B.token);
	});
});
