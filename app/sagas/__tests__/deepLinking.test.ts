// ─── Boundary mocks — must appear before any import that triggers the module ───

jest.mock('../../lib/methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getString: jest.fn()
	}
}));

jest.mock('../../lib/database/services/Server', () => ({
	getServerById: jest.fn()
}));

jest.mock('../../lib/methods/canOpenRoom', () => ({
	canOpenRoom: jest.fn()
}));

jest.mock('../../lib/methods/getServerInfo', () => ({
	getServerInfo: jest.fn()
}));

jest.mock('../../lib/methods/helpers/goRoom', () => ({
	goRoom: jest.fn(),
	navigateToRoom: jest.fn()
}));

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn()
}));

jest.mock('../../lib/services/connect', () => ({
	loginOAuthOrSso: jest.fn()
}));

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: {
			client: {
				host: ''
			}
		}
	}
}));

jest.mock('../../lib/services/restApi', () => ({
	notifyUser: jest.fn()
}));

jest.mock('../../lib/methods/videoConf', () => ({
	videoConfJoin: jest.fn()
}));

jest.mock('../../lib/services/voip/resetVoipState', () => ({
	resetVoipState: jest.fn()
}));

jest.mock('../../lib/navigation/appNavigation', () => ({
	__esModule: true,
	default: {
		navigate: jest.fn(),
		dispatch: jest.fn(),
		getCurrentRoute: jest.fn(),
		setParams: jest.fn()
	},
	waitForNavigationReady: jest.fn(() => Promise.resolve())
}));

jest.mock('i18n-js', () => ({
	__esModule: true,
	default: { t: (k: string) => k }
}));

// Mock helpers to avoid auxStore (getUidDirectMessage / getRoomTitle call reduxStore.getState())
jest.mock('../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => null),
	normalizeDeepLinkingServerHost: jest.fn((host: string) => host)
}));

// react-native-callkeep is manually mocked at __mocks__/react-native-callkeep.js

// ─── Real imports (after mocks) ───────────────────────────────────────────────

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { deepLinkingOpen } from '../../actions/deepLinking';
import { loginSuccess } from '../../actions/login';
import { selectServerSuccess } from '../../actions/server';
import { appStart } from '../../actions/app';
import { RootEnum } from '../../definitions';
import reducers from '../../reducers';
import deepLinkingRoot from '../deepLinking';
import UserPreferences from '../../lib/methods/userPreferences';
import { getServerById } from '../../lib/database/services/Server';
import { canOpenRoom } from '../../lib/methods/canOpenRoom';
import { getServerInfo } from '../../lib/methods/getServerInfo';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { waitForNavigationReady } from '../../lib/navigation/appNavigation';
import { loginOAuthOrSso } from '../../lib/services/connect';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import sdk from '../../lib/services/sdk';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Drains pending saga microtasks so all synchronous saga steps complete. */
async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

type PreloadedState = Parameters<typeof createStore>[1];

function setupStore(preloadedState?: PreloadedState) {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(deepLinkingRoot);
	return store;
}

/**
 * Creates a store with a collector middleware that records every action dispatched
 * through the middleware chain (including saga put() effects). The collector runs
 * before the saga middleware so it captures all actions.
 */
function setupStoreWithCollector(preloadedState?: PreloadedState) {
	const collected: any[] = [];
	const collectorMiddleware = () => (next: any) => (action: any) => {
		collected.push(action);
		return next(action);
	};
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(collectorMiddleware, sagaMiddleware));
	sagaMiddleware.run(deepLinkingRoot);
	return { store, collected };
}

// ─── Factories ────────────────────────────────────────────────────────────────

const HOST = 'https://open.rocket.chat';
const TOKEN = 'auth-token-abc';

/** Base deep-link params factory — host only. Extend per test. */
const makeParams = (overrides: Record<string, any> = {}) => ({
	host: HOST,
	...overrides
});

/** Params for the unknown-server-with-token path (F4 tests). */
const makeParamsWithToken = (overrides: Record<string, any> = {}) =>
	makeParams({ token: TOKEN, path: 'channel/general', ...overrides });

/** Server record stub as returned by getServerById / selectServerSuccess. */
const makeServerRecord = (overrides: Record<string, any> = {}) => ({
	id: HOST,
	version: '6.0.0',
	...overrides
});

/** Stored user token stub as returned by UserPreferences.getString(TOKEN_KEY-host). */
const makeStoredUser = () => TOKEN;

// ─── Regression race (new server + token + room path) ────────────────────────

describe('deepLinking saga — regression race (new server + token + room path)', () => {
	beforeEach(() => {
		jest.useFakeTimers();

		// Reset all mocks
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(canOpenRoom).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(goRoom).mockReset();
		jest.mocked(waitForNavigationReady).mockReset();

		// Default: unknown server (no current server match, no serverRecord)
		// getString(CURRENT_SERVER) → different server, getString(TOKEN_KEY-host) → null
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			// token for this host — not set (unknown server path)
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(null);

		// getServerInfo succeeds → unknown-server-with-token path
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '6.0.0' } as any);

		// canOpenRoom returns a room object
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' } as any);

		// waitForNavigationReady resolves immediately
		jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);

		// goRoom resolves immediately
		jest.mocked(goRoom).mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * Regression positive: full chain, dispatch SERVER.SELECT_SUCCESS,
	 * LOGIN.SUCCESS, then APP.START(ROOT_INSIDE). Assert goRoom called exactly
	 * once, sequenced after the APP.START dispatch.
	 */
	it('calls goRoom exactly once after APP.START(ROOT_INSIDE) completes the chain', async () => {
		const store = setupStore();
		const params = makeParamsWithToken();

		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();

		// Advance past the delay(1000) in the saga
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		// Saga is now waiting for SERVER.SELECT_SUCCESS
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		// Saga is now waiting for LOGIN.SUCCESS
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		// Saga has dispatched appReady and selected state.app.root.
		// Root is NOT yet ROOT_INSIDE (reducer hasn't seen ROOT_INSIDE yet),
		// so saga is waiting for APP.START(ROOT_INSIDE).
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		// Now dispatch APP.START(ROOT_INSIDE) — this satisfies the take.
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Regression negative: dispatch SERVER.SELECT_SUCCESS, LOGIN.SUCCESS.
	 * Flush microtasks. Assert goRoom NOT yet called.
	 * Then dispatch APP.START(ROOT_INSIDE). Flush. Assert goRoom called once.
	 */
	it('goRoom is NOT called between LOGIN.SUCCESS and APP.START(ROOT_INSIDE)', async () => {
		const store = setupStore();
		const params = makeParamsWithToken();

		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		// KEY ASSERTION: goRoom must NOT have been called yet
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		// Now release the saga by dispatching APP.START(ROOT_INSIDE)
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Early-exit branch: the saga selects state.app.root after LOGIN.SUCCESS.
	 * If root === ROOT_INSIDE at that moment, the take is skipped and goRoom fires
	 * immediately. We achieve this by dispatching APP.START(ROOT_INSIDE) synchronously
	 * before flushing, so the reducer updates the root before the saga's select runs.
	 */
	it('skips the APP.START take when state.app.root is already ROOT_INSIDE at select time', async () => {
		const store = setupStore();
		const params = makeParamsWithToken();

		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		// Dispatch LOGIN.SUCCESS AND APP.START(ROOT_INSIDE) synchronously before any flush.
		// The reducer processes both dispatches before the saga's select runs,
		// so the select sees ROOT_INSIDE and skips the take.
		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// goRoom should fire immediately — the take was skipped by the select short-circuit
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Wrong-root rejection: dispatch APP.START(ROOT_OUTSIDE) — wrong root.
	 * Assert goRoom NOT called. Then dispatch APP.START(ROOT_INSIDE). Assert goRoom
	 * called once.
	 */
	it('APP.START(ROOT_OUTSIDE) does not satisfy the take; APP.START(ROOT_INSIDE) does', async () => {
		const store = setupStore();
		const params = makeParamsWithToken();

		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		// Dispatch wrong root — saga's take predicate filters this out
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		await flushSagaMicrotasks();

		// goRoom must NOT have been called
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		// Now dispatch correct root — satisfies the take
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Multiple APP.START: after the take fires once, dispatch a second
	 * APP.START(ROOT_INSIDE). Assert goRoom still called only once (saga is past
	 * the take, takeLatest has not been retriggered).
	 */
	it('a second APP.START(ROOT_INSIDE) after navigation does not re-trigger goRoom', async () => {
		const store = setupStore();
		const params = makeParamsWithToken();

		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		// First APP.START(ROOT_INSIDE) — fires the take
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);

		// Second APP.START(ROOT_INSIDE) — saga is done, no re-trigger
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// Still exactly once
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});
});

// ─── Shared beforeEach helper for groups A–F ─────────────────────────────────

/** Default mock configuration used by groups A, B, C, D, E, F. */
function resetMocks() {
	jest.mocked(UserPreferences.getString).mockReset();
	jest.mocked(getServerById).mockReset();
	jest.mocked(canOpenRoom).mockReset();
	jest.mocked(getServerInfo).mockReset();
	jest.mocked(goRoom).mockReset();
	jest.mocked(waitForNavigationReady).mockReset();
	jest.mocked(loginOAuthOrSso).mockReset();
	jest.mocked(localAuthenticate).mockReset();

	jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);
	jest.mocked(goRoom).mockResolvedValue(undefined);
	jest.mocked(localAuthenticate).mockResolvedValue(undefined);
}

// ─── Shareextension ───────────────────────────────────────────────────────────

describe('deepLinking saga — shareextension', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
		// Restore sdk singleton host between tests
		(sdk as any).current.client.host = '';
	});

	/**
	 * No user stored → dispatches appInit(). No appStart dispatched.
	 */
	it('no user stored → dispatches appInit, no appStart', async () => {
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return HOST;
			return null; // no user token
		});

		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen({ type: 'shareextension', path: 'channel/general' }));
		await flushSagaMicrotasks();

		const types = collected.map(a => a.type);
		expect(types).toContain('APP_INIT');
		expect(types).not.toContain('APP_START');
	});

	/**
	 * User stored, sdk.current.client.host !== server → waits LOGIN.SUCCESS,
	 * dispatches shareSetParams, appStart(ROOT_SHARE_EXTENSION).
	 */
	it('user stored + sdk host mismatch → waits LOGIN.SUCCESS then dispatches shareSetParams + ROOT_SHARE_EXTENSION', async () => {
		const server = HOST;
		const serverRecord = makeServerRecord({ id: server, version: '6.0.0' });

		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return server;
			if (key === `reactnativemeteor_usertoken-${server}`) return TOKEN;
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(serverRecord as any);
		// sdk host differs from server → saga takes LOGIN.SUCCESS
		(sdk as any).current.client.host = 'https://other.server.com';

		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen({ type: 'shareextension', path: 'channel/general' }));
		await flushSagaMicrotasks();

		// Saga dispatched ROOT_LOADING_SHARE_EXTENSION and is waiting for LOGIN.SUCCESS
		expect(collected.map(a => a.type)).toContain('APP_START');
		// shareSetParams not yet dispatched
		expect(collected.find(a => a.type === 'SHARE_SET_PARAMS')).toBeUndefined();

		// Release the saga
		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();

		expect(collected.find(a => a.type === 'SHARE_SET_PARAMS')).toBeDefined();

		const appStarts = collected.filter(a => a.type === 'APP_START');
		expect(appStarts[appStarts.length - 1]?.root).toBe(RootEnum.ROOT_SHARE_EXTENSION);
	});

	/**
	 * User stored, sdk.current.client.host === server → same flow but does NOT
	 * wait on LOGIN.SUCCESS (so shareSetParams dispatches synchronously after flush).
	 */
	it('user stored + sdk host match → dispatches shareSetParams + ROOT_SHARE_EXTENSION without LOGIN.SUCCESS wait', async () => {
		const server = HOST;
		const serverRecord = makeServerRecord({ id: server, version: '6.0.0' });

		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return server;
			if (key === `reactnativemeteor_usertoken-${server}`) return TOKEN;
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(serverRecord as any);
		// sdk host matches server → saga skips take(LOGIN.SUCCESS)
		(sdk as any).current.client.host = server;

		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen({ type: 'shareextension', path: 'channel/general' }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// shareSetParams dispatched without LOGIN.SUCCESS
		expect(collected.find(a => a.type === 'SHARE_SET_PARAMS')).toBeDefined();
		const appStarts = collected.filter(a => a.type === 'APP_START');
		expect(appStarts[appStarts.length - 1]?.root).toBe(RootEnum.ROOT_SHARE_EXTENSION);
	});
});

// ─── OAuth ────────────────────────────────────────────────────────────────────

describe('deepLinking saga — oauth', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * Calls loginOAuthOrSso with extracted credentialToken + credentialSecret.
	 */
	it('calls loginOAuthOrSso with credentialToken and credentialSecret', async () => {
		jest.mocked(loginOAuthOrSso).mockResolvedValue(undefined);

		const { store } = setupStoreWithCollector();
		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'tok-123', credentialSecret: 'sec-456' }));
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledWith(
			{ oauth: { credentialToken: 'tok-123', credentialSecret: 'sec-456' } },
			false
		);
	});

	/**
	 * loginOAuthOrSso rejects → error is caught, no propagation, no further dispatch.
	 */
	it('loginOAuthOrSso rejection is swallowed — no propagation', async () => {
		jest.mocked(loginOAuthOrSso).mockRejectedValue(new Error('OAuth failed'));

		const { store, collected } = setupStoreWithCollector();
		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'tok-abc', credentialSecret: 'sec-xyz' }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// Saga swallows the error — no APP_START or APP_INIT after the DEEP_LINKING_OPEN
		const afterOpen = collected.filter(a => a.type !== 'DEEP_LINKING_OPEN');
		expect(afterOpen.map(a => a.type)).not.toContain('APP_START');
		expect(afterOpen.map(a => a.type)).not.toContain('APP_INIT');
	});
});

// ─── No host ──────────────────────────────────────────────────────────────────

describe('deepLinking saga — no host', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * Plain params (no voipAcceptFailed), state has a root → fallbackNavigation no-ops.
	 */
	it('plain no-host with root present → fallbackNavigation no-ops (no appInit)', async () => {
		const preloaded = {
			app: {
				root: RootEnum.ROOT_INSIDE,
				isMasterDetail: false,
				ready: true,
				foreground: true,
				background: false,
				notificationPresenceCap: false
			}
		};
		const { store, collected } = setupStoreWithCollector(preloaded as any);

		store.dispatch(deepLinkingOpen({}));
		await flushSagaMicrotasks();

		const types = collected.map(a => a.type);
		expect(types).not.toContain('APP_INIT');
	});

	/**
	 * Plain params, state has no root → dispatches appInit().
	 */
	it('plain no-host with no root → dispatches appInit', async () => {
		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen({}));
		await flushSagaMicrotasks();

		expect(collected.map(a => a.type)).toContain('APP_INIT');
	});
});

// ─── Same server ──────────────────────────────────────────────────────────────

describe('deepLinking saga — same server', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();

		// server === host, user stored, serverRecord exists
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return HOST;
			if (key === `reactnativemeteor_usertoken-${HOST}`) return TOKEN;
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' } as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * Already connected → goes straight to completeDeepLinkNavigation (goRoom called).
	 */
	it('already connected → calls goRoom directly without localAuthenticate or selectServerRequest', async () => {
		const preloaded = {
			server: {
				connected: true,
				connecting: false,
				failure: false,
				server: HOST,
				version: '6.0.0',
				name: 'open.rocket.chat',
				loading: false,
				previousServer: null,
				changingServer: false
			}
		};
		const store = setupStore(preloaded as any);

		store.dispatch(deepLinkingOpen(makeParams({ path: 'channel/general' })));
		await flushSagaMicrotasks();

		expect(jest.mocked(localAuthenticate)).not.toHaveBeenCalled();
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Not connected → localAuthenticate + selectServerRequest(host, version, true) +
	 * wait LOGIN.SUCCESS + goRoom.
	 */
	it('not connected → localAuthenticate, selectServerRequest(host, version, true), wait LOGIN.SUCCESS, then goRoom', async () => {
		// Default store: server.connected = false
		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen(makeParams({ path: 'channel/general' })));
		await flushSagaMicrotasks();

		expect(jest.mocked(localAuthenticate)).toHaveBeenCalledWith(HOST);

		const selectReq = collected.find(a => a.type === 'SERVER_SELECT_REQUEST');
		expect(selectReq).toBeDefined();
		expect(selectReq?.server).toBe(HOST);
		expect(selectReq?.fetchVersion).toBe(true);
		// same-server uses changeServer=false
		expect(selectReq?.changeServer).toBe(false);

		// goRoom not yet called — saga is waiting for LOGIN.SUCCESS
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});
});

// ─── Known different server ───────────────────────────────────────────────────

describe('deepLinking saga — known different server', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();

		// user token exists for HOST, serverRecord exists, but CURRENT_SERVER is different
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			if (key === `reactnativemeteor_usertoken-${HOST}`) return TOKEN;
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' } as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * localAuthenticate + selectServerRequest with changeServer=true +
	 * wait LOGIN.SUCCESS + goRoom.
	 */
	it('known different server → localAuthenticate, selectServerRequest with changeServer=true, wait LOGIN.SUCCESS, goRoom', async () => {
		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen(makeParams({ path: 'channel/general' })));
		await flushSagaMicrotasks();

		expect(jest.mocked(localAuthenticate)).toHaveBeenCalledWith(HOST);

		const selectReq = collected.find(a => a.type === 'SERVER_SELECT_REQUEST');
		expect(selectReq).toBeDefined();
		expect(selectReq?.server).toBe(HOST);
		expect(selectReq?.fetchVersion).toBe(true);
		// known different server uses changeServer=true
		expect(selectReq?.changeServer).toBe(true);

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});
});

// ─── Unknown server, getServerInfo fail ──────────────────────────────────────

describe('deepLinking saga — unknown server, getServerInfo fail', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();

		// Unknown server: no user token, no serverRecord
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(null);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * getServerInfo returns { success: false }, no voipAcceptFailed →
	 * fallbackNavigation. No root in state → dispatches appInit().
	 */
	it('getServerInfo failure → fallbackNavigation dispatches appInit when no root', async () => {
		jest.mocked(getServerInfo).mockResolvedValue({ success: false } as any);

		const { store, collected } = setupStoreWithCollector();

		store.dispatch(deepLinkingOpen(makeParams({ path: 'channel/general' })));
		await flushSagaMicrotasks();

		expect(collected.map(a => a.type)).toContain('APP_INIT');
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();
	});
});

// ─── Unknown server, getServerInfo ok, no token, invite path ─────────────────

describe('deepLinking saga — unknown server, getServerInfo ok, no token, invite path', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		resetMocks();

		// Unknown server: no user token, no serverRecord
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(null);
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '6.0.0' } as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/**
	 * getServerInfo ok, no token, path starts with invite/ →
	 * bootstraps new server (ROOT_OUTSIDE + serverInitAdd + delay(1000) + NewServer),
	 * then dispatches inviteLinksSetToken(token).
	 */
	it('invite path without token → bootstraps new server and dispatches inviteLinksSetToken', async () => {
		const inviteToken = 'xyz789';
		const { store, collected } = setupStoreWithCollector();

		// No token in params, invite path
		store.dispatch(deepLinkingOpen(makeParams({ path: `invite/${inviteToken}` })));
		await flushSagaMicrotasks();

		// Advance past delay(1000) in the saga
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		const types = collected.map(a => a.type);

		// New-server bootstrap: ROOT_OUTSIDE
		const appStartOutside = collected.find(a => a.type === 'APP_START' && a.root === RootEnum.ROOT_OUTSIDE);
		expect(appStartOutside).toBeDefined();

		// serverInitAdd dispatched
		expect(types).toContain('SERVER_INIT_ADD');

		// inviteLinksSetToken dispatched with the extracted token
		const setToken = collected.find(a => a.type === 'INVITE_LINKS_SET_TOKEN');
		expect(setToken).toBeDefined();
		expect(setToken?.token).toBe(inviteToken);

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();
	});
});
