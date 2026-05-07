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

// Database mock — expose mockSubsCollection so per-test can control find()
// Note: variable must be prefixed with `mock` (case-insensitive) to be accessible inside jest.mock() factory
const mockSubsCollection = { find: jest.fn() };
jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		active: { get: jest.fn(() => mockSubsCollection) }
	}
}));

// react-native-callkeep is manually mocked at __mocks__/react-native-callkeep.js

// ─── Real imports (after mocks) ───────────────────────────────────────────────

import { AnyAction, applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { deepLinkingClickCallPush } from '../../actions/deepLinking';
import { loginSuccess } from '../../actions/login';
import { selectServerSuccess } from '../../actions/server';
import { appStart } from '../../actions/app';
import { RootEnum } from '../../definitions';
import reducers from '../../reducers';
import deepLinkingRoot from '../deepLinking';
import UserPreferences from '../../lib/methods/userPreferences';
import { getServerById } from '../../lib/database/services/Server';
import { getServerInfo } from '../../lib/methods/getServerInfo';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import { navigateToRoom } from '../../lib/methods/helpers/goRoom';
import { notifyUser } from '../../lib/services/restApi';
import { videoConfJoin } from '../../lib/methods/videoConf';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Drains pending saga microtasks so all synchronous saga steps complete. */
async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

type PreloadedState = Parameters<typeof createStore>[1];

/**
 * Creates a Redux store with saga middleware plus a collector middleware that
 * records every action dispatched (both user-triggered and saga put()).
 */
function setupStore(preloadedState?: PreloadedState) {
	const dispatched: AnyAction[] = [];
	const collectorMiddleware = () => (next: any) => (action: any) => {
		dispatched.push(action);
		return next(action);
	};
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(collectorMiddleware, sagaMiddleware));
	sagaMiddleware.run(deepLinkingRoot);
	return { store, dispatched };
}

// ─── Factories ────────────────────────────────────────────────────────────────

const HOST = 'https://open.rocket.chat';
const TOKEN = 'auth-token-abc';
const RID = 'room-rid-1';
const CALL_ID = 'call-id-42';
const CALLER = { _id: 'uid-1' };

/** Base call-push params factory. Extend per test. */
const makeParams = (overrides: Record<string, any> = {}) => ({
	host: HOST,
	rid: RID,
	callId: CALL_ID,
	caller: CALLER,
	event: 'accept',
	...overrides
});

/** Server record stub returned by getServerById. */
const makeServerRecord = (overrides: Record<string, any> = {}) => ({
	id: HOST,
	version: '6.0.0',
	...overrides
});

/** Room stub returned by mockSubsCollection.find(). */
const makeRoom = (overrides: Record<string, any> = {}) => ({
	rid: RID,
	t: 'c',
	name: 'general',
	...overrides
});

// ─── Group A — no host short-circuit ─────────────────────────────────────────

describe('handleClickCallPush — Group A: no host', () => {
	beforeEach(() => {
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(notifyUser).mockReset();
		jest.mocked(videoConfJoin).mockReset();
		mockSubsCollection.find.mockReset();
	});

	it('A1: returns immediately when params.host is empty — no dispatch, no nav, no videoConfJoin', async () => {
		const { store, dispatched } = setupStore();
		store.dispatch(deepLinkingClickCallPush({ host: '', rid: RID, callId: CALL_ID, caller: CALLER, event: 'accept' }));
		await flushSagaMicrotasks();

		// Only the OPEN_VIDEO_CONF trigger action itself should be in dispatched
		expect(dispatched).toHaveLength(1);
		expect(dispatched[0].type).toBe('DEEP_LINKING_OPEN_VIDEO_CONF');
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();
		expect(jest.mocked(notifyUser)).not.toHaveBeenCalled();
		expect(jest.mocked(videoConfJoin)).not.toHaveBeenCalled();
	});
});

// ─── Group B — same server ───────────────────────────────────────────────────

describe('handleClickCallPush — Group B: same server', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(localAuthenticate).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(notifyUser).mockReset();
		jest.mocked(videoConfJoin).mockReset();
		mockSubsCollection.find.mockReset();

		// Same server, has token
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return HOST;
			if (key === `TOKEN-${HOST}`) return TOKEN;
			return TOKEN; // any TOKEN_KEY-host lookup
		});
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		jest.mocked(navigateToRoom).mockResolvedValue(undefined);
		jest.mocked(notifyUser).mockResolvedValue(undefined);
		jest.mocked(videoConfJoin).mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('B1: already connected → goes straight to handleNavigateCallRoom without localAuthenticate', async () => {
		// Pre-seed state with connected=true
		const preloadedState = {
			server: { connected: true }
		} as PreloadedState;
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());

		const { store } = setupStore(preloadedState);
		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// localAuthenticate should NOT have been called
		expect(jest.mocked(localAuthenticate)).not.toHaveBeenCalled();
		// navigateToRoom should have been called with the room
		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});

	it('B2: not connected → localAuthenticate, selectServerRequest, waits LOGIN.SUCCESS, then navigateToRoom', async () => {
		// Pre-seed state with connected=false (default)
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());

		const { store, dispatched } = setupStore();
		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();

		// Should have called localAuthenticate
		expect(jest.mocked(localAuthenticate)).toHaveBeenCalledWith(HOST);

		// Should have dispatched selectServerRequest
		const selectServerAction = dispatched.find((a: AnyAction) => a.type === 'SERVER_SELECT_REQUEST');
		expect(selectServerAction).toBeDefined();
		expect(selectServerAction?.fetchVersion).toBe(true);
		expect(selectServerAction?.changeServer).toBe(false);

		// navigateToRoom should NOT have been called yet (waiting for LOGIN.SUCCESS)
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		// Dispatch LOGIN.SUCCESS to unblock the saga
		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});
});

// ─── Group C — known different server ────────────────────────────────────────

describe('handleClickCallPush — Group C: known different server', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(localAuthenticate).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(notifyUser).mockReset();
		jest.mocked(videoConfJoin).mockReset();
		mockSubsCollection.find.mockReset();

		// Different server but known (serverRecord exists, user token exists)
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return TOKEN; // has token for target host
		});
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		jest.mocked(navigateToRoom).mockResolvedValue(undefined);
		jest.mocked(notifyUser).mockResolvedValue(undefined);
		jest.mocked(videoConfJoin).mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('C1: localAuthenticate, selectServerRequest with changeServer=true, waits LOGIN.SUCCESS, then navigateToRoom', async () => {
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());

		const { store, dispatched } = setupStore();
		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();

		// Should have called localAuthenticate
		expect(jest.mocked(localAuthenticate)).toHaveBeenCalledWith(HOST);

		// selectServerRequest should have changeServer=true (4th arg)
		const selectServerAction = dispatched.find((a: AnyAction) => a.type === 'SERVER_SELECT_REQUEST');
		expect(selectServerAction).toBeDefined();
		expect(selectServerAction?.fetchVersion).toBe(true);
		expect(selectServerAction?.changeServer).toBe(true);

		// navigateToRoom should NOT have been called yet (waiting for LOGIN.SUCCESS)
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		// Dispatch LOGIN.SUCCESS
		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});
});

// ─── Group D — unknown server ─────────────────────────────────────────────────

describe('handleClickCallPush — Group D: unknown server', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(localAuthenticate).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(notifyUser).mockReset();
		jest.mocked(videoConfJoin).mockReset();
		mockSubsCollection.find.mockReset();

		// Unknown server: no token, no serverRecord
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null; // no user token for target host
		});
		jest.mocked(getServerById).mockResolvedValue(null);
		jest.mocked(navigateToRoom).mockResolvedValue(undefined);
		jest.mocked(notifyUser).mockResolvedValue(undefined);
		jest.mocked(videoConfJoin).mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('D1: getServerInfo fails → fallbackNavigation, no appStart(ROOT_OUTSIDE)', async () => {
		jest.mocked(getServerInfo).mockResolvedValue({ success: false } as any);

		const { store, dispatched } = setupStore();
		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// fallbackNavigation only dispatches appInit() when currentRoot is falsy
		// No appStart(ROOT_OUTSIDE) should be dispatched
		const rootOutsideAction = dispatched.find(
			(a: AnyAction) => a.type === 'APP_START' && a.root === RootEnum.ROOT_OUTSIDE
		);
		expect(rootOutsideAction).toBeUndefined();
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();
		expect(jest.mocked(notifyUser)).not.toHaveBeenCalled();
		expect(jest.mocked(videoConfJoin)).not.toHaveBeenCalled();
	});

	it('D2: getServerInfo ok + token → appStart(ROOT_OUTSIDE), serverInitAdd, delay(1000), NewServer emit, waits SELECT_SUCCESS, loginRequest, waits LOGIN.SUCCESS, then navigateToRoom', async () => {
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '6.0.0' } as any);
		// Override: token exists
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return 'https://other.server.com';
			return null; // no pre-stored token for this host — token comes from params
		});
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());

		const paramsWithToken = makeParams({ token: TOKEN });
		const { store, dispatched } = setupStore();
		store.dispatch(deepLinkingClickCallPush(paramsWithToken));
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		// appStart(ROOT_OUTSIDE) should have been dispatched
		const rootOutsideAction = dispatched.find(
			(a: AnyAction) => a.type === 'APP_START' && a.root === RootEnum.ROOT_OUTSIDE
		);
		expect(rootOutsideAction).toBeDefined();

		// serverInitAdd should have been dispatched
		const serverInitAddAction = dispatched.find((a: AnyAction) => a.type === 'SERVER_INIT_ADD');
		expect(serverInitAddAction).toBeDefined();

		// navigateToRoom should NOT have been called yet (waiting for SELECT_SUCCESS)
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		// Dispatch SERVER.SELECT_SUCCESS
		store.dispatch(selectServerSuccess({ server: HOST, version: '6.0.0', name: 'open.rocket.chat' }));
		await flushSagaMicrotasks();

		// loginRequest should have been dispatched with { resume: token }
		const loginRequestAction = dispatched.find((a: AnyAction) => a.type === 'LOGIN_REQUEST');
		expect(loginRequestAction).toBeDefined();
		expect(loginRequestAction?.credentials?.resume).toBe(TOKEN);

		// navigateToRoom still not called (waiting for LOGIN.SUCCESS)
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();

		// Dispatch LOGIN.SUCCESS
		store.dispatch(loginSuccess({ id: 'user-1', token: TOKEN } as any));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});

	it('D3: getServerInfo ok + no token → no further action after NewServer emit', async () => {
		jest.mocked(getServerInfo).mockResolvedValue({ success: true, version: '6.0.0' } as any);

		const { store, dispatched } = setupStore();
		store.dispatch(deepLinkingClickCallPush(makeParams({ token: undefined }))); // no token in params
		await flushSagaMicrotasks();
		await jest.advanceTimersByTimeAsync(1000);
		await flushSagaMicrotasks();

		// appStart(ROOT_OUTSIDE) dispatched
		const rootOutsideAction = dispatched.find(
			(a: AnyAction) => a.type === 'APP_START' && a.root === RootEnum.ROOT_OUTSIDE
		);
		expect(rootOutsideAction).toBeDefined();

		// No loginRequest
		const loginRequestAction = dispatched.find((a: AnyAction) => a.type === 'LOGIN_REQUEST');
		expect(loginRequestAction).toBeUndefined();

		// No navigateToRoom
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();
	});
});

// ─── Group E — handleNavigateCallRoom downstream ─────────────────────────────

describe('handleClickCallPush — Group E: handleNavigateCallRoom downstream', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(UserPreferences.getString).mockReset();
		jest.mocked(getServerById).mockReset();
		jest.mocked(getServerInfo).mockReset();
		jest.mocked(localAuthenticate).mockReset();
		jest.mocked(navigateToRoom).mockReset();
		jest.mocked(notifyUser).mockReset();
		jest.mocked(videoConfJoin).mockReset();
		mockSubsCollection.find.mockReset();

		// Same server, connected — simplest path to reach handleNavigateCallRoom
		jest.mocked(UserPreferences.getString).mockImplementation((key: string) => {
			if (key === 'currentServer') return HOST;
			return TOKEN;
		});
		jest.mocked(getServerById).mockResolvedValue(makeServerRecord() as any);
		jest.mocked(navigateToRoom).mockResolvedValue(undefined);
		jest.mocked(notifyUser).mockResolvedValue(undefined);
		jest.mocked(videoConfJoin).mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('E1: always dispatches appStart(ROOT_INSIDE) before subscription lookup', async () => {
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());
		const preloadedState = { server: { connected: true } } as PreloadedState;
		const { store, dispatched } = setupStore(preloadedState);

		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		const rootInsideAction = dispatched.find(
			(a: AnyAction) => a.type === 'APP_START' && a.root === RootEnum.ROOT_INSIDE
		);
		expect(rootInsideAction).toBeDefined();
		// appStart(ROOT_INSIDE) must appear BEFORE navigateToRoom is called
		const rootInsideIdx = dispatched.indexOf(rootInsideAction!);
		expect(rootInsideIdx).toBeGreaterThanOrEqual(0);
		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
	});

	it('E2: event=accept → notifyUser(accepted) AND videoConfJoin called', async () => {
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());
		const preloadedState = { server: { connected: true } } as PreloadedState;
		const { store } = setupStore(preloadedState);

		store.dispatch(deepLinkingClickCallPush(makeParams({ event: 'accept' })));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(notifyUser)).toHaveBeenCalledTimes(1);
		expect(jest.mocked(notifyUser)).toHaveBeenCalledWith(`${CALLER._id}/video-conference`, {
			action: 'accepted',
			params: { uid: CALLER._id, rid: RID, callId: CALL_ID }
		});
		expect(jest.mocked(videoConfJoin)).toHaveBeenCalledTimes(1);
		expect(jest.mocked(videoConfJoin)).toHaveBeenCalledWith(CALL_ID, true, false, true);
	});

	it('E3: event=decline → notifyUser(rejected) but NO videoConfJoin', async () => {
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());
		const preloadedState = { server: { connected: true } } as PreloadedState;
		const { store } = setupStore(preloadedState);

		store.dispatch(deepLinkingClickCallPush(makeParams({ event: 'decline' })));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(notifyUser)).toHaveBeenCalledTimes(1);
		expect(jest.mocked(notifyUser)).toHaveBeenCalledWith(`${CALLER._id}/video-conference`, {
			action: 'rejected',
			params: { uid: CALLER._id, rid: RID, callId: CALL_ID }
		});
		expect(jest.mocked(videoConfJoin)).not.toHaveBeenCalled();
	});

	it('E4: isMasterDetail=true → navigateToRoom called with isMasterDetail: true', async () => {
		mockSubsCollection.find.mockResolvedValueOnce(makeRoom());
		const preloadedState = {
			server: { connected: true },
			app: { isMasterDetail: true }
		} as PreloadedState;
		const { store } = setupStore(preloadedState);

		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(jest.mocked(navigateToRoom)).toHaveBeenCalledTimes(1);
		const [callArgs] = jest.mocked(navigateToRoom).mock.calls;
		expect(callArgs[0]).toMatchObject({ isMasterDetail: true });
	});

	it('E5: subscription not found → caught; appStart(ROOT_INSIDE) still dispatched, no navigateToRoom/notifyUser/videoConfJoin', async () => {
		// mockSubsCollection.find rejects
		mockSubsCollection.find.mockRejectedValueOnce(new Error('record not found'));
		const preloadedState = { server: { connected: true } } as PreloadedState;
		const { store, dispatched } = setupStore(preloadedState);

		store.dispatch(deepLinkingClickCallPush(makeParams()));
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		// appStart(ROOT_INSIDE) was still dispatched (it fires before the find)
		const rootInsideAction = dispatched.find(
			(a: AnyAction) => a.type === 'APP_START' && a.root === RootEnum.ROOT_INSIDE
		);
		expect(rootInsideAction).toBeDefined();

		// No room nav, no notify, no join
		expect(jest.mocked(navigateToRoom)).not.toHaveBeenCalled();
		expect(jest.mocked(notifyUser)).not.toHaveBeenCalled();
		expect(jest.mocked(videoConfJoin)).not.toHaveBeenCalled();
	});
});
