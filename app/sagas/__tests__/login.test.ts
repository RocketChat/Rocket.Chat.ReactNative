// ─── Boundary mocks — must appear before any import that triggers the module ───
// The retry tests exercise handleLoginRequest's resume-login backoff. Only `login` (the resume call)
// and the redux state/timers matter; every other module is a native/network leaf reached only by the
// success pipeline, mocked here so LOGIN.SUCCESS stays inert.

jest.mock('../../lib/services/connect', () => ({
	login: jest.fn(),
	loginWithPassword: jest.fn(),
	disconnect: jest.fn()
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		servers: {
			get: () => ({
				query: () => ({ fetch: () => Promise.resolve([]) }),
				find: () => Promise.reject(new Error('not found'))
			}),
			write: (cb: () => Promise<void>) => cb()
		}
	}
}));

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: { subscribe: jest.fn(), current: { client: { host: '' } } }
}));

jest.mock('../../lib/services/restApi', () => ({
	saveUserProfile: jest.fn(() => Promise.resolve({ user: {} })),
	registerPushToken: jest.fn(() => Promise.resolve()),
	getUsersRoles: jest.fn(() => Promise.resolve([])),
	setUserPresenceAway: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: { setString: jest.fn(), getString: jest.fn() }
}));

jest.mock('../../lib/methods/getCustomEmojis', () => ({ getCustomEmojis: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/methods/getPermissions', () => ({ getPermissions: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/methods/getRoles', () => ({ getRoles: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/methods/getSlashCommands', () => ({ getSlashCommands: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/methods/getSettings', () => ({ subscribeSettings: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/methods/getUsersPresence', () => ({
	getUserPresence: jest.fn(() => Promise.resolve()),
	refreshDmUsersPresence: jest.fn(() => Promise.resolve()),
	subscribeUsersPresence: jest.fn(() => Promise.resolve())
}));
jest.mock('../../lib/methods/enterpriseModules', () => ({
	getEnterpriseModules: jest.fn(() => Promise.resolve()),
	isOmnichannelModuleAvailable: jest.fn(() => false),
	isVoipModuleAvailable: jest.fn(() => false)
}));
jest.mock('../../lib/methods/logout', () => ({
	logout: jest.fn(() => Promise.resolve()),
	removeServerData: jest.fn(() => Promise.resolve()),
	removeServerDatabase: jest.fn(() => Promise.resolve())
}));
jest.mock('../../lib/methods/helpers/helpers', () => ({ hasPermission: jest.fn(() => Promise.resolve([false, false])) }));
jest.mock('../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	events: {},
	logEvent: jest.fn()
}));
jest.mock('../../lib/hooks/useMasterDetail', () => ({ getIsMasterDetail: jest.fn(() => false) }));
jest.mock('../../lib/database/services/Server', () => ({ getServerById: jest.fn(() => Promise.resolve(null)) }));
jest.mock('../../lib/navigation/appNavigation', () => ({ __esModule: true, default: { navigate: jest.fn() } }));
jest.mock('../../containers/ActionSheet', () => ({ showActionSheetRef: jest.fn() }));
jest.mock('../../containers/SupportedVersions', () => ({ SupportedVersionsWarning: () => null }));
jest.mock('../../lib/services/voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { init: jest.fn(), reset: jest.fn() }
}));
jest.mock('../../lib/services/voip/MediaSessionStore', () => ({
	mediaSessionStore: { getCurrentInstance: jest.fn(() => null) }
}));
jest.mock('../../ee/omnichannel/lib', () => ({ isOmnichannelStatusAvailable: jest.fn(() => false) }));
jest.mock('../../ee/omnichannel/actions/inquiry', () => ({
	inquiryRequest: jest.fn(() => ({ type: 'INQUIRY_REQUEST' })),
	inquiryReset: jest.fn(() => ({ type: 'INQUIRY_RESET' }))
}));

// ─── Real imports (after mocks) ───────────────────────────────────────────────
/* eslint-disable import/first, import/order */
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import loginRoot from '../login';
import { loginRequest, clearUser } from '../../actions/login';
import { selectServerRequest } from '../../actions/server';
import { LOGIN, LOGOUT } from '../../actions/actionsTypes';
import reducers from '../../reducers';
import { login as loginService } from '../../lib/services/connect';
/* eslint-enable import/first, import/order */

const SERVER = 'https://open.rocket.chat';
const TOKEN = 'resume-token';
const USER = { id: 'u-me', username: 'me', name: 'Me', token: TOKEN };

async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

function setupStore() {
	const actions: { type: string }[] = [];
	const recorder = () => (next: (a: any) => any) => (action: any) => {
		actions.push(action);
		return next(action);
	};
	const sagaMiddleware = createSagaMiddleware();
	const preloadedState: any = {
		login: {
			isLocalAuthenticated: true,
			isAuthenticated: true,
			isFetching: false,
			user: { ...USER },
			error: {},
			services: {},
			failure: false
		},
		server: { server: SERVER, version: '6.0.0', name: 'open', connecting: false, loading: false }
	};
	const store = createStore(reducers, preloadedState, applyMiddleware(recorder, sagaMiddleware));
	sagaMiddleware.run(loginRoot);
	return { store, actions };
}

const typesOf = (actions: { type: string }[], type: string) => actions.filter(a => a.type === type);

describe('login saga — resume-login retry with backoff', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(loginService).mockReset();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('retries a transient resume failure with 2s/4s/8s backoff, then succeeds', async () => {
		jest
			.mocked(loginService)
			.mockRejectedValueOnce(new Error('network blip'))
			.mockRejectedValueOnce(new Error('network blip'))
			.mockResolvedValueOnce(USER as any);

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));

		// First attempt fails synchronously -> parked in delay(2000).
		await flushSagaMicrotasks();
		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(1);
		expect(typesOf(actions, LOGIN.SUCCESS)).toHaveLength(0);
		expect(typesOf(actions, LOGIN.FAILURE)).toHaveLength(0);

		await jest.advanceTimersByTimeAsync(2000);
		await flushSagaMicrotasks();
		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(2);

		await jest.advanceTimersByTimeAsync(4000);
		await flushSagaMicrotasks();
		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(3);

		// Third attempt resolves -> loginSuccess, never loginFailure.
		expect(typesOf(actions, LOGIN.SUCCESS)).toHaveLength(1);
		expect(typesOf(actions, LOGIN.FAILURE)).toHaveLength(0);
	});

	it('dispatches loginFailure after exhausting the bounded retries', async () => {
		jest.mocked(loginService).mockRejectedValue(new Error('still down'));

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));

		// Initial attempt + 3 retries = 4 total, across 2s/4s/8s backoffs.
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(2000);
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(4000);
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(8000);
		await flushSagaMicrotasks();

		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(4);
		expect(typesOf(actions, LOGIN.FAILURE)).toHaveLength(1);
	});

	it('does not retry a 401 — logs the session out instead', async () => {
		jest.mocked(loginService).mockRejectedValue({ status: 401 });

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));

		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(20000);
		await flushSagaMicrotasks();

		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(1);
		expect(typesOf(actions, LOGOUT)).toHaveLength(1);
		expect(typesOf(actions, LOGIN.FAILURE)).toHaveLength(0);
	});

	it('does not retry when the server logged the user out', async () => {
		jest.mocked(loginService).mockRejectedValue({ data: { message: "You've been logged out by the server" } });

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));

		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(20000);
		await flushSagaMicrotasks();

		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(1);
		expect(typesOf(actions, LOGOUT)).toHaveLength(1);
	});

	it('does not retry when the session has expired', async () => {
		jest.mocked(loginService).mockRejectedValue({ data: { message: 'Your session has expired' } });

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));

		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(20000);
		await flushSagaMicrotasks();

		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(1);
		expect(typesOf(actions, LOGOUT)).toHaveLength(1);
	});

	it('bails out mid-backoff when the user token is gone', async () => {
		jest.mocked(loginService).mockRejectedValue(new Error('network blip'));

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));
		await flushSagaMicrotasks();

		// User logs out during the wait -> the abandoned session must not be re-logged-in.
		store.dispatch(clearUser());
		await jest.advanceTimersByTimeAsync(2000);
		await flushSagaMicrotasks();

		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(1);
		expect(typesOf(actions, LOGIN.FAILURE)).toHaveLength(1);
	});

	it('bails out mid-backoff when the server changed', async () => {
		jest.mocked(loginService).mockRejectedValue(new Error('network blip'));

		const { store, actions } = setupStore();
		store.dispatch(loginRequest({ resume: TOKEN }, false));
		await flushSagaMicrotasks();

		store.dispatch(selectServerRequest('https://another.server.com', '6.0.0'));
		await jest.advanceTimersByTimeAsync(2000);
		await flushSagaMicrotasks();

		expect(jest.mocked(loginService)).toHaveBeenCalledTimes(1);
		expect(typesOf(actions, LOGIN.FAILURE)).toHaveLength(1);
	});
});
