jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(() => Promise.resolve()),
	saveLastLocalAuthenticationSession: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(() => Promise.resolve()),
	setUserPresenceAway: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/notifications', () => ({
	checkPendingNotification: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/services/connect', () => ({
	checkAndReopen: jest.fn(),
	getSocketStaleness: jest.fn()
}));

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: {
		current: {
			ddp: null as any
		}
	}
}));

jest.mock('../../lib/methods/loadMissedMessages', () => ({
	loadMissedMessages: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

import { type AnyAction, type Middleware, applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import stateRootSaga from '../state';
import { APP_STATE, ROOMS } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import { setUserPresenceOnline, setUserPresenceAway } from '../../lib/services/restApi';
import { loadMissedMessages } from '../../lib/methods/loadMissedMessages';
import { readMessages } from '../../lib/methods/readMessages';
import sdk from '../../lib/services/sdk';
import { checkAndReopen, getSocketStaleness } from '../../lib/services/connect';
import { appStart } from '../../actions/app';
import { loginSuccess } from '../../actions/login';
import { connectSuccess } from '../../actions/connect';
import { selectServerSuccess } from '../../actions/server';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';

const mockedLoadMissedMessages = loadMissedMessages as jest.MockedFunction<typeof loadMissedMessages>;
const mockedReadMessages = readMessages as jest.MockedFunction<typeof readMessages>;

const RID = 'ROOM_ID';

async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 60; i += 1) {
		await Promise.resolve();
	}
}

function setupStoreWithAuth({ connected = true, isAuthenticated = true, subscribedRoom = RID } = {}) {
	const sagaMiddleware = createSagaMiddleware();
	const dispatched: AnyAction[] = [];
	const recorder: Middleware = () => next => action => {
		dispatched.push(action);
		return next(action);
	};
	const store = createStore(
		reducers,
		{
			login: { isAuthenticated, user: { id: 'user1' } },
			meteor: { connected },
			app: { root: RootEnum.ROOT_INSIDE, ready: true, foreground: false, background: true },
			server: { server: 'https://open.rocket.chat', version: '7.4.0' },
			room: { rid: '', isDeleting: false, subscribedRoom, historyLoaders: [] }
		} as never,
		applyMiddleware(recorder, sagaMiddleware)
	);
	sagaMiddleware.run(stateRootSaga);
	return { store, dispatched };
}

describe('foreground saga', () => {
	let now = Date.UTC(2024, 0, 1);

	beforeEach(() => {
		jest.clearAllMocks();
		// Every read jumps 2 min so the 60s rooms-delta throttle never suppresses a test's foreground.
		jest.spyOn(Date, 'now').mockImplementation(() => (now += 120_000));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('re-syncs the subscribed room exactly once and marks it read', async () => {
		const { store, dispatched } = setupStoreWithAuth();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedLoadMissedMessages).toHaveBeenCalledTimes(1);
		expect(mockedLoadMissedMessages).toHaveBeenCalledWith({ rid: RID });
		expect(mockedReadMessages).toHaveBeenCalledTimes(1);
		expect(mockedReadMessages).toHaveBeenCalledWith(RID, expect.any(Date));
		expect(dispatched.some(action => action.type === ROOMS.REQUEST)).toBe(true);
		expect(setUserPresenceOnline).toHaveBeenCalled();
	});

	it('does not sync a room when none is subscribed, but still requests the rooms delta', async () => {
		const { store, dispatched } = setupStoreWithAuth({ subscribedRoom: '' });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		expect(mockedReadMessages).not.toHaveBeenCalled();
		expect(dispatched.some(action => action.type === ROOMS.REQUEST)).toBe(true);
	});

	it('does nothing while not connected', async () => {
		const { store, dispatched } = setupStoreWithAuth({ connected: false });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		expect(mockedReadMessages).not.toHaveBeenCalled();
		expect(dispatched.some(action => action.type === ROOMS.REQUEST)).toBe(false);
		expect(setUserPresenceOnline).not.toHaveBeenCalled();
	});

	it('completes and still sets presence online when the room sync rejects', async () => {
		mockedLoadMissedMessages.mockRejectedValueOnce(new Error('offline'));
		const { store } = setupStoreWithAuth();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedReadMessages).not.toHaveBeenCalled();
		expect(setUserPresenceOnline).toHaveBeenCalled();
	});
});

type PreloadedState = Parameters<typeof createStore>[1];

function setupStore(preloadedState?: PreloadedState) {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(stateRootSaga);
	return store;
}

function makeDdp(overrides: Record<string, any> = {}) {
	return {
		lastPing: Date.now(),
		pingInterval: 10000,
		reopenNow: jest.fn(() => Promise.resolve()),
		probe: jest.fn(() => Promise.resolve(true)),
		...overrides
	};
}

const HOST = 'https://open.rocket.chat';

describe('state saga — foreground stale-socket reconnect', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		(sdk.current as any).ddp = null;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	function setupReadyStore() {
		const store = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		store.dispatch(selectServerSuccess({ server: HOST, name: 'open.rocket.chat', version: '6.0.0' }));
		store.dispatch(loginSuccess({ id: 'user-1', token: 'token-abc' } as any));
		store.dispatch(connectSuccess());
		flushSagaMicrotasks();
		return store;
	}

	it('calls reopenNow when socket is stale (age > 2 * pingInterval)', async () => {
		const ddp = makeDdp({ lastPing: Date.now() - 25000 });
		(sdk.current as any).ddp = ddp;
		jest.mocked(getSocketStaleness).mockReturnValue('stale');
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(ddp.reopenNow).toHaveBeenCalledTimes(1);
		expect(ddp.probe).not.toHaveBeenCalled();
		expect(checkAndReopen).not.toHaveBeenCalled();
	});

	it('probes when socket is gray (pingInterval < age <= 2 * pingInterval)', async () => {
		const ddp = makeDdp({ lastPing: Date.now() - 15000 });
		(sdk.current as any).ddp = ddp;
		jest.mocked(getSocketStaleness).mockReturnValue('gray');
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(ddp.probe).toHaveBeenCalledTimes(1);
		expect(ddp.probe).toHaveBeenCalledWith(2000);
		expect(ddp.reopenNow).not.toHaveBeenCalled();
		expect(checkAndReopen).not.toHaveBeenCalled();
	});

	it('calls reopenNow when probe resolves false', async () => {
		const ddp = makeDdp({ lastPing: Date.now() - 15000, probe: jest.fn(() => Promise.resolve(false)) });
		(sdk.current as any).ddp = ddp;
		jest.mocked(getSocketStaleness).mockReturnValue('gray');
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();
		await flushSagaMicrotasks();

		expect(ddp.probe).toHaveBeenCalledTimes(1);
		expect(ddp.reopenNow).toHaveBeenCalledTimes(1);
		expect(checkAndReopen).not.toHaveBeenCalled();
	});

	it('falls back to checkAndReopen when socket is fresh (age <= pingInterval)', async () => {
		const ddp = makeDdp({ lastPing: Date.now() - 5000 });
		(sdk.current as any).ddp = ddp;
		jest.mocked(getSocketStaleness).mockReturnValue('fresh');
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(checkAndReopen).toHaveBeenCalledTimes(1);
		expect(ddp.probe).not.toHaveBeenCalled();
		expect(ddp.reopenNow).not.toHaveBeenCalled();
	});

	it('does not stack probes during rapid foreground flaps', async () => {
		const resolvers: Array<(value: boolean) => void> = [];
		const ddp = makeDdp({
			lastPing: Date.now() - 15000,
			probe: jest.fn(() => new Promise<boolean>(resolve => resolvers.push(resolve)))
		});
		(sdk.current as any).ddp = ddp;
		jest.mocked(getSocketStaleness).mockReturnValue('gray');
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();
		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(ddp.probe).toHaveBeenCalledTimes(1);

		resolvers.forEach(resolve => resolve(true));
		await flushSagaMicrotasks();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(ddp.probe).toHaveBeenCalledTimes(2);

		resolvers.forEach(resolve => resolve(true));
	});

	it('still calls reopenNow immediately when stale while a gray probe is in flight', async () => {
		const resolvers: Array<(value: boolean) => void> = [];
		const ddp = makeDdp({
			lastPing: Date.now() - 15000,
			probe: jest.fn(() => new Promise<boolean>(resolve => resolvers.push(resolve)))
		});
		(sdk.current as any).ddp = ddp;
		jest.mocked(getSocketStaleness).mockReturnValueOnce('gray').mockReturnValueOnce('stale');
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();
		expect(ddp.probe).toHaveBeenCalledTimes(1);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(ddp.reopenNow).toHaveBeenCalledTimes(1);
		resolvers.forEach(resolve => resolve(true));
	});
});

describe('state saga — foreground early exits', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		(sdk.current as any).ddp = null;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('does nothing when not ROOT_INSIDE', async () => {
		const store = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(localAuthenticate).not.toHaveBeenCalled();
		expect(setUserPresenceOnline).not.toHaveBeenCalled();
	});

	it('does nothing when not authenticated', async () => {
		const store = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		store.dispatch(selectServerSuccess({ server: HOST, name: 'open.rocket.chat', version: '6.0.0' }));
		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(localAuthenticate).not.toHaveBeenCalled();
		expect(setUserPresenceOnline).not.toHaveBeenCalled();
	});
});

describe('state saga — background', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('sets presence away when authenticated and inside', async () => {
		const store = setupStore();
		store.dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		store.dispatch(selectServerSuccess({ server: HOST, name: 'open.rocket.chat', version: '6.0.0' }));
		store.dispatch(loginSuccess({ id: 'user-1', token: 'token-abc' } as any));
		store.dispatch(connectSuccess());
		await flushSagaMicrotasks();

		store.dispatch({ type: APP_STATE.BACKGROUND });
		await flushSagaMicrotasks();

		expect(setUserPresenceAway).toHaveBeenCalledTimes(1);
	});
});
