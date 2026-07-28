jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(),
	saveLastLocalAuthenticationSession: jest.fn()
}));

jest.mock('../../lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(),
	setUserPresenceAway: jest.fn()
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

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { APP_STATE } from '../../actions/actionsTypes';
import { appStart } from '../../actions/app';
import { loginSuccess } from '../../actions/login';
import { connectSuccess } from '../../actions/connect';
import { selectServerSuccess } from '../../actions/server';
import { RootEnum } from '../../definitions';
import reducers from '../../reducers';
import stateRoot from '../state';
import { localAuthenticate } from '../../lib/methods/helpers/localAuthentication';
import { setUserPresenceOnline, setUserPresenceAway } from '../../lib/services/restApi';
import sdk from '../../lib/services/sdk';
import { checkAndReopen, getSocketStaleness } from '../../lib/services/connect';

async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

type PreloadedState = Parameters<typeof createStore>[1];

function setupStore(preloadedState?: PreloadedState) {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, preloadedState, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(stateRoot);
	return store;
}

const HOST = 'https://open.rocket.chat';

function makeDdp(overrides: Record<string, any> = {}) {
	return {
		lastPing: Date.now(),
		pingInterval: 10000,
		reopenNow: jest.fn(() => Promise.resolve()),
		probe: jest.fn(() => Promise.resolve(true)),
		...overrides
	};
}

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
