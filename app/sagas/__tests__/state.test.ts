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

jest.mock('../../lib/services/socketHealth', () => ({
	recoverSocket: jest.fn(() => Promise.resolve('confirmed-alive'))
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
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
import { recoverSocket } from '../../lib/services/socketHealth';
import log from '../../lib/methods/helpers/log';

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

describe('state saga — foreground socket recovery', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
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

	it('requests recovery once when foregrounding while inside and authenticated', async () => {
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(recoverSocket).toHaveBeenCalledTimes(1);
		expect(setUserPresenceOnline).toHaveBeenCalledTimes(1);
	});

	it('logs a recovery rejection and still sets presence online', async () => {
		const failure = new Error('reopen failed');
		jest.mocked(recoverSocket).mockRejectedValueOnce(failure);
		const store = setupReadyStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(log).toHaveBeenCalledWith(failure);
		expect(setUserPresenceOnline).toHaveBeenCalledTimes(1);
	});
});

describe('state saga — foreground early exits', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
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
