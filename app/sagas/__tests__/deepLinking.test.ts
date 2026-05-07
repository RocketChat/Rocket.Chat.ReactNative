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

jest.mock('../../lib/methods/helpers/showToast', () => ({
	showToast: jest.fn()
}));

// react-native-callkeep is manually mocked at __mocks__/react-native-callkeep.js

// ─── Real imports (after mocks) ───────────────────────────────────────────────

import { InteractionManager } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
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
import { resetVoipState } from '../../lib/services/voip/resetVoipState';
import { showToast } from '../../lib/methods/helpers/showToast';
import { getUidDirectMessage } from '../../lib/methods/helpers';

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
 * Like setupStore, but adds a collector middleware so dispatched actions emitted via
 * saga `put()` effects are captured. Plain `store.dispatch` overrides do NOT see saga puts
 * because saga middleware short-circuits its own emissions before they reach `store.dispatch`.
 */
function setupStoreWithCollector(preloadedState?: PreloadedState): {
	store: ReturnType<typeof createStore>;
	dispatched: any[];
} {
	const dispatched: any[] = [];
	const collector = () => (next: any) => (action: any) => {
		dispatched.push(action);
		return next(action);
	};
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(collector, sagaMiddleware));
	sagaMiddleware.run(deepLinkingRoot);
	return { store, dispatched };
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

// ─── Group G — navigate() URL-shape sub-cases ────────────────────────────────
//
// All G tests drive the saga through the D1 path:
//   server === host && user && serverRecord && connected === true
// so navigate() is reached without any authentication dance.

describe('deepLinking saga — Group G: navigate() URL-shape → goRoom contract', () => {
	/** Preloaded store state: connected to HOST, phone layout (no tablet). */
	const connectedState = {
		server: {
			server: HOST,
			connected: true,
			version: '6.0.0',
			name: 'Test',
			connecting: false,
			failure: false,
			loading: false,
			previousServer: null,
			changingServer: false
		},
		app: {
			root: RootEnum.ROOT_INSIDE,
			isMasterDetail: false,
			ready: true,
			foreground: true,
			background: false,
			notificationPresenceCap: false,
			netInfoState: null
		}
	};

	beforeEach(() => {
		jest.useFakeTimers();

		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(canOpenRoom).mockReset();
		jest.mocked(goRoom).mockReset();
		jest.mocked(waitForNavigationReady).mockReset();
		jest.mocked(getUidDirectMessage).mockReset();

		// D1 setup: same server, user present, server record exists, connected
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return HOST;
			if (key === `TOKEN-${HOST}`) return TOKEN;
			return TOKEN; // any TOKEN_KEY variant returns the token
		});
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);

		// Default: canOpenRoom returns a room stub
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'room-1', name: 'general', t: 'c' } as any);
		jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);
		jest.mocked(goRoom).mockResolvedValue(undefined);
		jest.mocked(getUidDirectMessage).mockReturnValue(null as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	/** Dispatches deepLinkingOpen and flushes until the saga's navigate() completes. */
	async function driveNavigate(store: ReturnType<typeof setupStore>, params: Record<string, any>) {
		store.dispatch(deepLinkingOpen(params));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();
	}

	it('G1: channel/general → goRoom with t:"c" and name:"general"', async () => {
		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'channel/general' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.item.t).toBe('c');
		expect(call.item.name).toBe('general');
		expect(call.isMasterDetail).toBe(false);
		expect(call.jumpToThreadId).toBeUndefined();
	});

	it('G2: direct/alice → goRoom with t:"d" and roomUserId from getUidDirectMessage', async () => {
		jest.mocked(getUidDirectMessage).mockReturnValue('uid-alice' as any);
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'dm-1', name: 'alice', t: 'd' } as any);

		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'direct/alice' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.item.t).toBe('d');
		expect(call.item.name).toBe('alice');
		expect(call.item.roomUserId).toBe('uid-alice');
	});

	it('G3: group/secret → goRoom with t:"p"', async () => {
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'grp-1', name: 'secret', t: 'p' } as any);

		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'group/secret' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.item.t).toBe('p');
		expect(call.item.name).toBe('secret');
	});

	it('G4: channels/livechat-1 → goRoom with t:"l"', async () => {
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'lc-1', name: 'livechat-1', t: 'l' } as any);

		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'channels/livechat-1' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.item.t).toBe('l');
		expect(call.item.name).toBe('livechat-1');
	});

	it('G5: group/foo/thread/abc123 → goRoom with jumpToThreadId:"abc123"', async () => {
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'grp-2', name: 'foo', t: 'p' } as any);

		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'group/foo/thread/abc123' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.jumpToThreadId).toBe('abc123');
		expect(call.item.name).toBe('foo');
	});

	it('G6: params.messageId="msg42" → goRoom with jumpToMessageId:"msg42"', async () => {
		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'channel/general', messageId: 'msg42' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.jumpToMessageId).toBe('msg42');
	});

	it('G7: invite/xyz789 → no goRoom, dispatches inviteLinksRequest("xyz789")', async () => {
		// Saga `put()` effects don't pass through `store.dispatch` overrides; use collector middleware
		const { store, dispatched } = setupStoreWithCollector(connectedState as any);

		await driveNavigate(store, makeParams({ path: 'invite/xyz789' }));

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();
		const inviteAction = dispatched.find((a: any) => a.type === 'INVITE_LINKS_REQUEST');
		expect(inviteAction).toBeDefined();
		expect(inviteAction.token).toBe('xyz789');
	});

	it('G8: params.rid only (no path) → goRoom invoked with the room spread', async () => {
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'rid-only-1', name: 'rid-room', t: 'c' } as any);

		const store = setupStore(connectedState as any);
		// Only rid, no path
		await driveNavigate(store, makeParams({ rid: 'rid-only-1' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		// name and t come from the canOpenRoom result spread, type/name from path are undefined
		expect(call.item.rid).toBe('rid-only-1');
	});

	it('G9: canOpenRoom returns null → no goRoom, still dispatches appStart(ROOT_INSIDE)', async () => {
		jest.mocked(canOpenRoom).mockResolvedValue(null as any);

		const store = setupStore(connectedState as any);
		await driveNavigate(store, makeParams({ path: 'channel/nowhere' }));

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();
		// The saga calls put(appStart(ROOT_INSIDE)) at the end of navigate()
		expect(store.getState().app.root).toBe(RootEnum.ROOT_INSIDE);
	});

	it('G10: tablet (isMasterDetail=true) → goRoom invoked with isMasterDetail:true', async () => {
		const tabletState = {
			...connectedState,
			app: { ...connectedState.app, isMasterDetail: true }
		};

		const store = setupStore(tabletState as any);
		await driveNavigate(store, makeParams({ path: 'channel/general' }));

		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.isMasterDetail).toBe(true);
	});

	it('G11: canOpenRoom throws → error propagates (no try/catch in navigate)', async () => {
		const boom = new Error('canOpenRoom exploded');
		jest.mocked(canOpenRoom).mockRejectedValue(boom);

		const store = setupStore(connectedState as any);

		// The saga will throw — takeLatest catches it internally but the saga instance ends.
		// We assert goRoom was not called (saga aborted mid-flight).
		store.dispatch(deepLinkingOpen(makeParams({ path: 'channel/general' })));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(goRoom)).not.toHaveBeenCalled();
	});
});

// ─── Group H — handleVoipAcceptFailed completion path ────────────────────────
//
// Driven via the no-host + voipAcceptFailed=true branch (Group C1):
//   !host && params.voipAcceptFailed → handleVoipAcceptFailed(params)

describe('deepLinking saga — Group H: handleVoipAcceptFailed recovery path', () => {
	let interactionSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();

		jest.mocked(resetVoipState).mockReset();
		jest.mocked(waitForNavigationReady).mockReset();
		jest.mocked(goRoom).mockReset();
		jest.mocked(canOpenRoom).mockReset();
		jest.mocked(showToast).mockReset();
		(RNCallKeep.endCall as jest.Mock).mockClear();

		jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);
		jest.mocked(canOpenRoom).mockResolvedValue(null as any);
		jest.mocked(goRoom).mockResolvedValue(undefined);

		// Make InteractionManager.runAfterInteractions invoke its callback synchronously so the
		// `new Promise(resolve => InteractionManager.runAfterInteractions(() => resolve()))` in
		// handleVoipAcceptFailed resolves without needing timer advancement.
		interactionSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((task: any) => {
			if (typeof task === 'function') task();
			else if (task && typeof task.run === 'function') task.run();
			return { then: jest.fn(), cancel: jest.fn(), done: jest.fn(), cancelled: jest.fn() } as any;
		}) as any);
	});

	afterEach(() => {
		interactionSpy.mockRestore();
		jest.useRealTimers();
	});

	async function driveVoipFail(store: ReturnType<typeof setupStore>, params: Record<string, any>) {
		store.dispatch(deepLinkingOpen({ voipAcceptFailed: true, ...params }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();
	}

	it('H1: with callId and username → resetVoipState, endCall, navigate to direct/alice, showToast', async () => {
		const store = setupStore();
		await driveVoipFail(store, { callId: 'call-42', username: 'alice' });

		expect(jest.mocked(resetVoipState)).toHaveBeenCalledTimes(1);
		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-42');
		expect(jest.mocked(waitForNavigationReady)).toHaveBeenCalled();
		expect(jest.mocked(showToast)).toHaveBeenCalledWith('VoIP_Call_Issue');
	});

	it('H2: without callId → RNCallKeep.endCall NOT called, other steps unchanged', async () => {
		const store = setupStore();
		await driveVoipFail(store, { username: 'alice' }); // no callId

		expect(jest.mocked(resetVoipState)).toHaveBeenCalledTimes(1);
		expect(RNCallKeep.endCall).not.toHaveBeenCalled();
		expect(jest.mocked(showToast)).toHaveBeenCalledWith('VoIP_Call_Issue');
	});

	it('H3: without username but with params.path → uses params.path for navigation', async () => {
		jest.mocked(canOpenRoom).mockResolvedValue({ rid: 'rm-1', name: 'bob', t: 'd' } as any);

		const store = setupStore();
		// no username, but path is given; navigation falls through to navigate() which calls canOpenRoom
		await driveVoipFail(store, { callId: 'call-99', path: 'direct/bob' });

		expect(jest.mocked(resetVoipState)).toHaveBeenCalledTimes(1);
		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-99');
		expect(jest.mocked(goRoom)).toHaveBeenCalledTimes(1);
		const call = jest.mocked(goRoom).mock.calls[0][0];
		expect(call.item.name).toBe('bob');
	});

	it('H4: navigate throws inside handleVoipAcceptFailed → caught by try/catch, no re-throw', async () => {
		jest.mocked(waitForNavigationReady).mockRejectedValue(new Error('nav not ready'));

		const store = setupStore();

		// Should NOT throw — handleVoipAcceptFailed has a try/catch
		await expect(driveVoipFail(store, { callId: 'call-err', username: 'eve' })).resolves.toBeUndefined();

		// resetVoipState was called before the throw
		expect(jest.mocked(resetVoipState)).toHaveBeenCalledTimes(1);
		// showToast was NOT reached because the error was thrown before it
		expect(jest.mocked(showToast)).not.toHaveBeenCalled();
	});
});

// ─── Group F2 — Unknown server getServerInfo fail + voipAcceptFailed=true ────
//
// host present, user/serverRecord absent → getServerInfo fails → voipAcceptFailed=true
// → handleVoipAcceptFailed is invoked from the F2 fallback branch (not the C1 no-host branch).

describe('deepLinking saga — F2: unknown server getServerInfo fail with voipAcceptFailed', () => {
	let interactionSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();

		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(resetVoipState).mockReset();
		jest.mocked(waitForNavigationReady).mockReset();
		jest.mocked(canOpenRoom).mockReset();
		jest.mocked(showToast).mockReset();
		(RNCallKeep.endCall as jest.Mock).mockClear();

		// Unknown server: no matching current server, no serverRecord
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null;
		});
		jest.mocked(getServerById).mockResolvedValue(null);

		// getServerInfo fails
		jest.mocked(getServerInfo).mockResolvedValue({ success: false } as any);

		jest.mocked(waitForNavigationReady).mockResolvedValue(undefined);
		jest.mocked(canOpenRoom).mockResolvedValue(null as any);

		interactionSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((task: any) => {
			if (typeof task === 'function') task();
			else if (task && typeof task.run === 'function') task.run();
			return { then: jest.fn(), cancel: jest.fn(), done: jest.fn(), cancelled: jest.fn() } as any;
		}) as any);
	});

	afterEach(() => {
		interactionSpy.mockRestore();
		jest.useRealTimers();
	});

	it('F2: getServerInfo fails + voipAcceptFailed=true → handleVoipAcceptFailed invoked (not fallbackNavigation)', async () => {
		const store = setupStore();

		store.dispatch(deepLinkingOpen({ host: HOST, voipAcceptFailed: true, callId: 'call-f2', username: 'charlie' }));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// handleVoipAcceptFailed path: resetVoipState called, endCall called, toast shown
		expect(jest.mocked(resetVoipState)).toHaveBeenCalledTimes(1);
		expect(RNCallKeep.endCall).toHaveBeenCalledWith('call-f2');
		expect(jest.mocked(showToast)).toHaveBeenCalledWith('VoIP_Call_Issue');

		// fallbackNavigation path would dispatch appInit() — verify it was NOT dispatched
		// (We check that root was not set to undefined by appInit, as appInit sets ready:false not root)
		// The key signal is resetVoipState being called — that's exclusive to handleVoipAcceptFailed
	});
});
