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

// handleNavigateCallRoom reads database.active.get('subscriptions').find(rid).
// Configured per test via jest.mocked(database.active.get) in beforeEach.
jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
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

import { deepLinkingOpen, deepLinkingClickCallPush } from '../../actions/deepLinking';
import { loginSuccess } from '../../actions/login';
import { selectServerSuccess } from '../../actions/server';
import { connectSuccess } from '../../actions/connect';
import { appStart } from '../../actions/app';
import { LOGIN, SERVER } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import reducers from '../../reducers';
import deepLinkingRoot from '../deepLinking';
import UserPreferences from '../../lib/methods/userPreferences';
import { getServerById } from '../../lib/database/services/Server';
import { canOpenRoom } from '../../lib/methods/canOpenRoom';
import { getServerInfo } from '../../lib/methods/getServerInfo';
import { goRoom, navigateToRoom } from '../../lib/methods/helpers/goRoom';
import { waitForNavigationReady } from '../../lib/navigation/appNavigation';
import { loginOAuthOrSso } from '../../lib/services/connect';
import sdk from '../../lib/services/sdk';
import EventEmitter from '../../lib/methods/helpers/events';
import database from '../../lib/database';

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

/** setupStore that also records dispatched actions (incl. saga puts) for assertions. */
function setupRecordingStore(preloadedState?: PreloadedState) {
	const actions: { type: string }[] = [];
	const recorder = () => (next: (a: any) => any) => (action: any) => {
		actions.push(action);
		return next(action);
	};
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(recorder, sagaMiddleware));
	sagaMiddleware.run(deepLinkingRoot);
	return { store, actions };
}

// ─── Factories ────────────────────────────────────────────────────────────────

const HOST = 'https://open.rocket.chat';
const TOKEN = 'auth-token-abc';

/** Base deep-link params factory — host only. Extend per test. */
const makeParams = (overrides: Record<string, any> = {}) => ({
	host: HOST,
	...overrides
});

/** Params for the unknown-server-with-token path. */
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

// ─── Regression race (new server + token + room path) ──────────────

describe('deepLinking saga — Regression race (new server + token + room path)', () => {
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

		// The saga waits for METEOR.SUCCESS ('connected') before dispatching
		// loginRequest, so it never logs in on a still-connecting socket.
		store.dispatch(connectSuccess());
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

	// Ordering race: socket connects before SERVER.SELECT_SUCCESS; the guard must
	// skip the already-fired METEOR.SUCCESS take instead of hanging.
	it('completes the chain when METEOR.SUCCESS fires before SERVER.SELECT_SUCCESS', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen(makeParamsWithToken()));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		// Socket connects first — before SERVER.SELECT_SUCCESS is dispatched.
		store.dispatch(connectSuccess());
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	// loginRequest must not fire until the socket is connected (locks the gate).
	it('does not dispatch loginRequest until METEOR.SUCCESS', async () => {
		const { store, actions } = setupRecordingStore();
		const loginRequested = () => actions.some(a => a.type === LOGIN.REQUEST);

		store.dispatch(deepLinkingOpen(makeParamsWithToken()));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		// Server selected but socket not connected yet → still parked at the gate.
		expect(loginRequested()).toBe(false);

		store.dispatch(connectSuccess());
		await flushSagaMicrotasks();

		// Socket connected → gate released, loginRequest dispatched.
		expect(loginRequested()).toBe(true);
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

		// The saga waits for METEOR.SUCCESS ('connected') before dispatching
		// loginRequest, so it never logs in on a still-connecting socket.
		store.dispatch(connectSuccess());
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

		// The saga waits for METEOR.SUCCESS ('connected') before dispatching
		// loginRequest, so it never logs in on a still-connecting socket.
		store.dispatch(connectSuccess());
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

		// The saga waits for METEOR.SUCCESS ('connected') before dispatching
		// loginRequest, so it never logs in on a still-connecting socket.
		store.dispatch(connectSuccess());
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

		// The saga waits for METEOR.SUCCESS ('connected') before dispatching
		// loginRequest, so it never logs in on a still-connecting socket.
		store.dispatch(connectSuccess());
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

/**
 * Scenario: The user opens the app for the first time on a workspace that the
 * SDK websocket is already connected to (e.g. they registered a server), then
 * a deeplink with an auth token arrives for that same host.
 */
describe('deepLinking saga — server already connected, should skip changing server', () => {
	beforeEach(() => {
		jest.useFakeTimers();

		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(canOpenRoom).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(goRoom).mockReset();
		jest.mocked(waitForNavigationReady).mockReset();

		// A different server is currently set; no stored credentials for HOST.
		// This ensures we reach the else-branch (different server path) and then
		// fall through to the getServerInfo / hostAlreadyConnected check.
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(null);
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '6.0.0' } as any);
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' } as any);
		jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);
		jest.mocked(goRoom).mockResolvedValue(undefined);

		// Key setup: SDK websocket is already open to HOST
		(sdk.current as any).client.host = HOST;
	});

	afterEach(() => {
		jest.useRealTimers();
		// Reset so other describe blocks see the default empty host
		(sdk.current as any).client.host = '';
	});

	/**
	 * Regression positive: the full chain completes without SERVER.SELECT_SUCCESS.
	 * Before the fix this would hang because selectServer dispatches SELECT_CANCEL
	 * (not SELECT_SUCCESS) when the server is already connected.
	 */
	it('calls goRoom after LOGIN.SUCCESS + APP.START(ROOT_INSIDE) without needing SERVER.SELECT_SUCCESS', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen(makeParamsWithToken()));
		// Two flushes drain the getServerById and getServerInfo promise microtasks.
		// No jest.advanceTimersByTimeAsync needed — delay(1000) is skipped when
		// hostAlreadyConnected is true.
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// Saga must be parked at take(LOGIN.SUCCESS), not take(SERVER.SELECT_SUCCESS)
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		// Drive the rest of the chain WITHOUT dispatching selectServerSuccess
		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Side-effect guard: the saga must NOT emit a 'NewServer' event when the
	 * SDK is already connected — doing so would trigger the selectServer saga,
	 * which would dispatch SELECT_CANCEL and leave deeplink auth stuck.
	 */
	it('does not emit NewServer when the SDK is already connected to the deeplink host', async () => {
		const emitSpy = jest.spyOn(EventEmitter, 'emit');

		const store = setupStore();
		store.dispatch(deepLinkingOpen(makeParamsWithToken()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(emitSpy).not.toHaveBeenCalledWith('NewServer', expect.anything());

		// Complete the flow to confirm the saga finishes correctly
		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		emitSpy.mockRestore();
	});
});

// ─── handleClickCallPush (OPEN_VIDEO_CONF) — new server + token ──────────────────

describe('deepLinking saga — handleClickCallPush (new server + token + call room)', () => {
	/** Call-push params: host + token + the rid handleNavigateCallRoom looks up. */
	const makeCallParams = (overrides: Record<string, any> = {}) => makeParamsWithToken({ rid: 'room-1', ...overrides });

	beforeEach(() => {
		jest.useFakeTimers();

		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(database.active.get).mockReset();

		// Unknown server with a token → reaches the SELECT_SUCCESS/METEOR.SUCCESS gate.
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(null);
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '6.0.0' } as any);

		// handleNavigateCallRoom resolves the subscription for params.rid.
		jest.mocked(database.active.get).mockReturnValue({
			find: jest.fn().mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' })
		} as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// Ordering race (call-push path): socket connects before SERVER.SELECT_SUCCESS;
	// the guard must skip the already-fired METEOR.SUCCESS take instead of hanging.
	it('completes the call-room chain when METEOR.SUCCESS fires before SERVER.SELECT_SUCCESS', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingClickCallPush(makeCallParams()));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		// Socket connects first — before SERVER.SELECT_SUCCESS is dispatched.
		store.dispatch(connectSuccess());
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});

	// Happy path: full chain in normal order navigates once.
	it('navigates to the call room once after the full chain completes', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingClickCallPush(makeCallParams()));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		// Still parked at the METEOR.SUCCESS gate — no navigation yet.
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		store.dispatch(connectSuccess());
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});

	// loginRequest must not fire until the socket is connected (locks the gate).
	it('does not dispatch loginRequest until METEOR.SUCCESS', async () => {
		const { store, actions } = setupRecordingStore();
		const loginRequested = () => actions.some(a => a.type === LOGIN.REQUEST);

		store.dispatch(deepLinkingClickCallPush(makeCallParams()));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		// Server selected but socket not connected yet → still parked at the gate.
		expect(loginRequested()).toBe(false);

		store.dispatch(connectSuccess());
		await flushSagaMicrotasks();

		// Socket connected → gate released, loginRequest dispatched.
		expect(loginRequested()).toBe(true);
	});
});

// ─── handleOAuth — single-use credentialToken dedup guard ────────────────────

describe('deepLinking saga — handleOAuth dedup guard', () => {
	// handleOAuth tracks the consumed credentialToken in module scope and it is never reset between
	// tests, so every oauth case here must use a globally-unique token or the guard silently suppresses it.
	beforeEach(() => {
		jest.mocked(loginOAuthOrSso).mockReset();
		jest.mocked(loginOAuthOrSso).mockResolvedValue(undefined as any);
	});

	it('calls loginOAuthOrSso with the oauth credentials on a fresh token', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-fresh-A', credentialSecret: 'secret-A' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(1);
		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledWith({
			oauth: { credentialToken: 'token-fresh-A', credentialSecret: 'secret-A' }
		});
	});

	it('does not call loginOAuthOrSso when the credentialSecret is missing', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-no-secret-D' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).not.toHaveBeenCalled();
	});

	it('does not call loginOAuthOrSso a second time for the same credentialToken', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-dup-B', credentialSecret: 'secret-B' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// Second dispatch with the identical token — guard must suppress it.
		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-dup-B', credentialSecret: 'secret-B' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(1);
	});

	it('calls loginOAuthOrSso again for a different credentialToken after a previous one was consumed', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-first-C', credentialSecret: 'secret-C' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// A distinct token must not be blocked by the guard.
		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-second-C', credentialSecret: 'secret-C2' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(2);
		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenNthCalledWith(2, {
			oauth: { credentialToken: 'token-second-C', credentialSecret: 'secret-C2' }
		});
	});
});

// ─── Same-server warm start — honest-session gate ─────────────────────────
// The socket can die without SERVER.SELECT_* ever resetting selection state. The warm-start
// same-server branch must gate on the honest flags (state.meteor.connected + state.login.isAuthenticated),
// re-running connect/login on a dead or stranded session before navigating onto it.

describe('deepLinking saga — same-server warm start gates on honest session state', () => {
	const makeSameServerParams = (overrides: Record<string, any> = {}) => makeParams({ path: 'channel/general', ...overrides });

	const preload = ({ meteorConnected, isAuthenticated }: { meteorConnected: boolean; isAuthenticated: boolean }) =>
		({
			meteor: { connecting: false, connected: meteorConnected },
			login: {
				isLocalAuthenticated: true,
				isAuthenticated,
				isFetching: false,
				user: { id: 'u-me', token: TOKEN },
				error: {},
				services: {},
				failure: false
			}
		} as unknown as PreloadedState);

	beforeEach(() => {
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(canOpenRoom).mockReset();
		jest.mocked(waitForNavigationReady).mockReset();
		jest.mocked(goRoom).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(database.active.get).mockReset();

		// Same host as the current server, with stored credentials and a known server record.
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => (key === 'currentServer' ? HOST : TOKEN));
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord());
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' } as any);
		jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);
		jest.mocked(goRoom).mockResolvedValue(undefined);
		jest.mocked(database.active.get).mockReturnValue({
			find: jest.fn().mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' })
		} as any);
	});

	const selectRequested = (actions: { type: string }[]) => actions.some(a => a.type === SERVER.SELECT_REQUEST);

	it('re-runs connect/login before navigating when the socket is dead (notification tap)', async () => {
		const { store, actions } = setupRecordingStore(preload({ meteorConnected: false, isAuthenticated: true }));

		store.dispatch(deepLinkingOpen(makeSameServerParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// Pipeline re-runs and navigation is parked at take(LOGIN.SUCCESS).
		expect(selectRequested(actions)).toBe(true);
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// Navigation proceeds only after the login pipeline completes.
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	it('re-runs the pipeline when the socket is up but the resume login stranded (authenticated=false)', async () => {
		const { store, actions } = setupRecordingStore(preload({ meteorConnected: true, isAuthenticated: false }));

		store.dispatch(deepLinkingOpen(makeSameServerParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(selectRequested(actions)).toBe(true);
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	it('skips connect/login and navigates immediately when connected and authenticated', async () => {
		const { store, actions } = setupRecordingStore(preload({ meteorConnected: true, isAuthenticated: true }));

		store.dispatch(deepLinkingOpen(makeSameServerParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(selectRequested(actions)).toBe(false);
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	it('applies the same gate on the call-push warm start (dead socket re-runs pipeline)', async () => {
		const { store, actions } = setupRecordingStore(preload({ meteorConnected: false, isAuthenticated: true }));

		store.dispatch(deepLinkingClickCallPush({ host: HOST, rid: 'room-1' }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(selectRequested(actions)).toBe(true);
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});
});
