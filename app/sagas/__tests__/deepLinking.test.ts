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

// ─── Group F4 — Regression race (new server + token + room path) ──────────────

describe('deepLinking saga — F4 regression race (new server + token + room path)', () => {
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
	 * F4a — Regression positive: full chain, dispatch SERVER.SELECT_SUCCESS,
	 * LOGIN.SUCCESS, then APP.START(ROOT_INSIDE). Assert goRoom called exactly
	 * once, sequenced after the APP.START dispatch.
	 */
	it('F4a: calls goRoom exactly once after APP.START(ROOT_INSIDE) completes the chain', async () => {
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
	 * F4b — Regression negative: dispatch SERVER.SELECT_SUCCESS, LOGIN.SUCCESS.
	 * Flush microtasks. Assert goRoom NOT yet called.
	 * Then dispatch APP.START(ROOT_INSIDE). Flush. Assert goRoom called once.
	 */
	it('F4b: goRoom is NOT called between LOGIN.SUCCESS and APP.START(ROOT_INSIDE)', async () => {
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
	 * F4c — Early-exit branch: the saga selects state.app.root after LOGIN.SUCCESS.
	 * If root === ROOT_INSIDE at that moment, the take is skipped and goRoom fires
	 * immediately. We achieve this by dispatching APP.START(ROOT_INSIDE) synchronously
	 * before flushing, so the reducer updates the root before the saga's select runs.
	 */
	it('F4c: skips the APP.START take when state.app.root is already ROOT_INSIDE at select time', async () => {
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
	 * F4d — Wrong-root rejection: dispatch APP.START(ROOT_OUTSIDE) — wrong root.
	 * Assert goRoom NOT called. Then dispatch APP.START(ROOT_INSIDE). Assert goRoom
	 * called once.
	 */
	it('F4d: APP.START(ROOT_OUTSIDE) does not satisfy the take; APP.START(ROOT_INSIDE) does', async () => {
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
	 * F4e — Multiple APP.START: after the take fires once, dispatch a second
	 * APP.START(ROOT_INSIDE). Assert goRoom still called only once (saga is past
	 * the take, takeLatest has not been retriggered).
	 */
	it('F4e: a second APP.START(ROOT_INSIDE) after navigation does not re-trigger goRoom', async () => {
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
