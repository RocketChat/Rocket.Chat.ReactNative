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
		host: null
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

jest.mock('../../lib/services/socketHealth', () => ({
	recoverSocket: jest.fn(() => Promise.resolve('confirmed-alive'))
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

import { deepLinkingOpen, deepLinkingClickCallPush } from '../../actions/deepLinking';
import { loginFailure, loginSuccess } from '../../actions/login';
import { selectServerFailure, selectServerSuccess } from '../../actions/server';
import { appStart } from '../../actions/app';
import { APP, LOGOUT, SERVER } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import deepLinkingRoot from '../deepLinking';
import UserPreferences from '../../lib/methods/userPreferences';
import { getServerById } from '../../lib/database/services/Server';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import { canOpenRoom } from '../../lib/methods/canOpenRoom';
import { getServerInfo } from '../../lib/methods/getServerInfo';
import { goRoom, navigateToRoom } from '../../lib/methods/helpers/goRoom';
import { waitForNavigationReady } from '../../lib/navigation/appNavigation';
import { loginOAuthOrSso } from '../../lib/services/connect';
import { recoverSocket } from '../../lib/services/socketHealth';
import sdk from '../../lib/services/sdk';
import database from '../../lib/database';
import EventEmitter from '../../lib/methods/helpers/events';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../lib/testUtils/sagaStore';
import type { RecordingStore } from '../../lib/testUtils/sagaStore';

const setupStore = (): RecordingStore => createRecordingStore(deepLinkingRoot);

afterEach(cancelSagaTasks);

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
		const { store } = setupStore();
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

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	it('retries canOpenRoom after calling recoverSocket when the first canOpenRoom attempt fails', async () => {
		const store = setupStore();
		const params = makeParamsWithToken();

		// Simulate a dormant socket: the first canOpenRoom fails because the REST
		// fallback can't reach the server; after recoverSocket restores the connection,
		// the retry succeeds.
		jest
			.mocked(canOpenRoom)
			.mockResolvedValueOnce(false as any)
			.mockResolvedValueOnce({ rid: 'room-1', name: 'general', t: 'c' } as any);

		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(recoverSocket)).toHaveBeenCalled();
		expect(jest.mocked(canOpenRoom)).toHaveBeenCalledTimes(2);
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Regression negative: dispatch SERVER.SELECT_SUCCESS, LOGIN.SUCCESS.
	 * Flush microtasks. Assert goRoom NOT yet called.
	 * Then dispatch APP.START(ROOT_INSIDE). Flush. Assert goRoom called once.
	 */
	it('goRoom is NOT called between LOGIN.SUCCESS and APP.START(ROOT_INSIDE)', async () => {
		const { store } = setupStore();
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

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Early-exit branch: the saga selects state.app.root after LOGIN.SUCCESS.
	 * If root === ROOT_INSIDE at that moment, the take is skipped and goRoom fires
	 * immediately. We achieve this by dispatching APP.START(ROOT_INSIDE) synchronously
	 * before flushing, so the reducer updates the root before the saga's select runs.
	 */
	it('skips the APP.START take when state.app.root is already ROOT_INSIDE at select time', async () => {
		const { store } = setupStore();
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

		// goRoom should fire immediately — the take was skipped by the select short-circuit
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Wrong-root rejection: dispatch APP.START(ROOT_OUTSIDE) — wrong root.
	 * Assert goRoom NOT called. Then dispatch APP.START(ROOT_INSIDE). Assert goRoom
	 * called once.
	 */
	it('APP.START(ROOT_OUTSIDE) does not satisfy the take; APP.START(ROOT_INSIDE) does', async () => {
		const { store } = setupStore();
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

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
	});

	/**
	 * Multiple APP.START: after the take fires once, dispatch a second
	 * APP.START(ROOT_INSIDE). Assert goRoom still called only once (saga is past
	 * the take, takeLatest has not been retriggered).
	 */
	it('a second APP.START(ROOT_INSIDE) after navigation does not re-trigger goRoom', async () => {
		const { store } = setupStore();
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

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);

		// Second APP.START(ROOT_INSIDE) — saga is done, no re-trigger
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
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
		(sdk as any).host = HOST;
	});

	afterEach(() => {
		jest.useRealTimers();
		(sdk as any).host = null;
	});

	/**
	 * Regression positive: the full chain completes without SERVER.SELECT_SUCCESS.
	 * Before the fix this would hang because selectServer dispatches SELECT_CANCEL
	 * (not SELECT_SUCCESS) when the server is already connected.
	 */
	it('calls goRoom after LOGIN.SUCCESS + APP.START(ROOT_INSIDE) without needing SERVER.SELECT_SUCCESS', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen(makeParamsWithToken()));
		// No jest.advanceTimersByTimeAsync needed — delay(1000) is skipped when
		// hostAlreadyConnected is true.
		await flushSagaMicrotasks();

		// Saga must be parked at take(LOGIN.SUCCESS), not take(SERVER.SELECT_SUCCESS)
		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		// Drive the rest of the chain WITHOUT dispatching selectServerSuccess
		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();

		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
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

		const { store } = setupStore();
		store.dispatch(deepLinkingOpen(makeParamsWithToken()));
		await flushSagaMicrotasks();

		expect(emitSpy).not.toHaveBeenCalledWith('NewServer', expect.anything());

		// Complete the flow to confirm the saga finishes correctly
		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		emitSpy.mockRestore();
	});
});

// ─── handleClickCallPush (OPEN_VIDEO_CONF) — new server + token ───────────────

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

		// Unknown server with a token → reaches the SELECT_SUCCESS gate.
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

	it('navigates to the call room once after SELECT_SUCCESS and LOGIN.SUCCESS', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingClickCallPush(makeCallParams()));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		store.dispatch(selectServerSuccess({ ...makeServerRecord(), name: 'open.rocket.chat', server: HOST }));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: makeStoredUser() } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
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
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-fresh-A', credentialSecret: 'secret-A' } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(1);
		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledWith({
			oauth: { credentialToken: 'token-fresh-A', credentialSecret: 'secret-A' }
		});
	});

	it('does not call loginOAuthOrSso when the credentialSecret is missing', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-no-secret-D' } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).not.toHaveBeenCalled();
	});

	it('does not call loginOAuthOrSso a second time for the same credentialToken', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-dup-B', credentialSecret: 'secret-B' } as any));
		await flushSagaMicrotasks();

		// Second dispatch with the identical token — guard must suppress it.
		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-dup-B', credentialSecret: 'secret-B' } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(1);
	});

	it('calls loginOAuthOrSso again for a different credentialToken after a previous one was consumed', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-first-C', credentialSecret: 'secret-C' } as any));
		await flushSagaMicrotasks();

		// A distinct token must not be blocked by the guard.
		store.dispatch(deepLinkingOpen({ type: 'oauth', credentialToken: 'token-second-C', credentialSecret: 'secret-C2' } as any));
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(2);
		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenNthCalledWith(2, {
			oauth: { credentialToken: 'token-second-C', credentialSecret: 'secret-C2' }
		});
	});
});

describe('deepLinking saga — unknown host hands off to the add-server flow', () => {
	const PREVIOUS_SERVER = 'https://previous.rocket.chat';

	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();

		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return PREVIOUS_SERVER;
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(undefined as any);
		jest.mocked(getServerInfo).mockResolvedValue({ success: true } as any);
		(sdk as any).host = PREVIOUS_SERVER;
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('starts the outside stack, seeds the previous server, then emits NewServer for the host', async () => {
		const emit = jest.spyOn(EventEmitter, 'emit').mockImplementation(() => {});
		const { store, dispatchedActions } = setupStore();

		store.dispatch(deepLinkingOpen(makeParams() as any));
		await flushSagaMicrotasks();

		const outsideIndex = dispatchedActions.findIndex(
			action => action.type === APP.START && action.root === RootEnum.ROOT_OUTSIDE
		);
		const initAddIndex = dispatchedActions.findIndex(action => action.type === SERVER.INIT_ADD);

		expect(outsideIndex).toBeGreaterThanOrEqual(0);
		expect(initAddIndex).toBeGreaterThan(outsideIndex);
		expect(dispatchedActions[initAddIndex].previousServer).toBe(PREVIOUS_SERVER);
		expect(emit).not.toHaveBeenCalledWith('NewServer', { server: HOST });

		jest.advanceTimersByTime(1000);
		await flushSagaMicrotasks();

		expect(emit).toHaveBeenCalledWith('NewServer', { server: HOST });
		emit.mockRestore();
	});
});

describe('deepLinking saga — handleShareExtension user-facing roots', () => {
	beforeEach(() => {
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return HOST;
			return makeStoredUser();
		});
		(sdk as any).host = null;
	});

	afterEach(() => {
		cancelSagaTasks();
		(sdk as any).host = null;
	});

	it('lands on ROOT_OUTSIDE, not the loading root, when the server record is missing', async () => {
		jest.mocked(getServerById).mockResolvedValue(null as any);
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'shareextension' } as any));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('lands on ROOT_OUTSIDE when the login that the share sheet waits on fails', async () => {
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'shareextension' } as any));
		await flushSagaMicrotasks();
		expect(store.getState().app.root).toBe(RootEnum.ROOT_LOADING_SHARE_EXTENSION);

		store.dispatch(loginFailure({ message: 'connect failed' }));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('lands on ROOT_OUTSIDE when selecting the server fails while the share sheet waits', async () => {
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'shareextension' } as any));
		await flushSagaMicrotasks();

		store.dispatch(selectServerFailure());
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('lands on ROOT_OUTSIDE when the server logs the share sheet out instead of failing the login', async () => {
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'shareextension' } as any));
		await flushSagaMicrotasks();

		store.dispatch({ type: LOGOUT });
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('lands on ROOT_OUTSIDE when local authentication throws', async () => {
		jest.mocked(localAuthenticate).mockRejectedValueOnce(new Error('biometrics unavailable'));
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'shareextension' } as any));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_OUTSIDE);
	});

	it('still reaches ROOT_SHARE_EXTENSION when the login succeeds', async () => {
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'shareextension' } as any));
		await flushSagaMicrotasks();

		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();

		expect(store.getState().app.root).toBe(RootEnum.ROOT_SHARE_EXTENSION);
	});
});

describe('deepLinking saga — handleSaml', () => {
	beforeEach(() => {
		jest.mocked(loginOAuthOrSso).mockReset();
		jest.mocked(loginOAuthOrSso).mockResolvedValue(undefined as any);
	});

	it('redeems the SAML credential token through the regular saml login', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'saml', host: HOST, credentialToken: 'saml-fresh-A' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(1);
		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledWith({ saml: true, credentialToken: 'saml-fresh-A' });
	});

	it('does not call loginOAuthOrSso when the credentialToken is missing', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'saml', host: HOST } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).not.toHaveBeenCalled();
	});

	it('does not redeem the same SAML credentialToken twice', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'saml', host: HOST, credentialToken: 'saml-dup-B' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// The credential token is single use on the server, so a replayed deep link must be suppressed.
		store.dispatch(deepLinkingOpen({ type: 'saml', host: HOST, credentialToken: 'saml-dup-B' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(1);
	});

	it('redeems a different SAML credentialToken after a previous one was consumed', async () => {
		const { store } = setupStore();

		store.dispatch(deepLinkingOpen({ type: 'saml', host: HOST, credentialToken: 'saml-first-C' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		store.dispatch(deepLinkingOpen({ type: 'saml', host: HOST, credentialToken: 'saml-second-C' } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenCalledTimes(2);
		expect(jest.mocked(loginOAuthOrSso)).toHaveBeenNthCalledWith(2, { saml: true, credentialToken: 'saml-second-C' });
	});
});
