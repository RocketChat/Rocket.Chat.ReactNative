// ─── Boundary mocks — must appear before any import that triggers the module ───

jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(() => Promise.resolve()),
	saveLastLocalAuthenticationSession: jest.fn(() => Promise.resolve())
}));
jest.mock('../../lib/services/connect', () => ({ checkAndReopen: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/services/restApi', () => ({
	setUserPresenceOnline: jest.fn(() => Promise.resolve()),
	setUserPresenceAway: jest.fn(() => Promise.resolve())
}));
jest.mock('../../lib/notifications', () => ({ checkPendingNotification: jest.fn(() => Promise.resolve()) }));
jest.mock('../../lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

// ─── Real imports (after mocks) ───────────────────────────────────────────────
/* eslint-disable import/first, import/order */
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import stateRoot from '../state';
import { APP_STATE, LOGIN } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import reducers from '../../reducers';
import { checkAndReopen } from '../../lib/services/connect';
/* eslint-enable import/first, import/order */

const SERVER = 'https://open.rocket.chat';
const TOKEN = 'resume-token';

async function flushSagaMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

function setupStore(loginOverrides: Record<string, any>) {
	const actions: { type: string }[] = [];
	const recorder = () => (next: (a: any) => any) => (action: any) => {
		actions.push(action);
		return next(action);
	};
	const sagaMiddleware = createSagaMiddleware();
	const preloadedState: any = {
		app: { root: RootEnum.ROOT_INSIDE, foreground: false, background: true, ready: true, netInfoState: null },
		login: {
			isLocalAuthenticated: true,
			isAuthenticated: false,
			isFetching: false,
			user: {},
			error: {},
			services: {},
			failure: false,
			...loginOverrides
		},
		server: { server: SERVER, version: '6.0.0', name: 'open', connected: true, loading: false }
	};
	const store = createStore(reducers, preloadedState, applyMiddleware(recorder, sagaMiddleware));
	sagaMiddleware.run(stateRoot);
	return { store, actions };
}

const loginRequests = (actions: { type: string }[]) => actions.filter(a => a.type === LOGIN.REQUEST);

describe('state saga — foreground heal after a stranded resume login', () => {
	beforeEach(() => {
		jest.mocked(checkAndReopen).mockClear();
	});

	it('dispatches a resume loginRequest when a stored token exists but the session is not authenticated', async () => {
		const { store, actions } = setupStore({ isAuthenticated: false, user: { id: 'u-me', token: TOKEN } });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(loginRequests(actions)).toHaveLength(1);
		expect((loginRequests(actions)[0] as any).credentials).toEqual({ resume: TOKEN });
		// Heal branch is minimal: it must not touch the authenticated reconnect path.
		expect(jest.mocked(checkAndReopen)).not.toHaveBeenCalled();
	});

	it('does nothing when there is no stored user token', async () => {
		const { store, actions } = setupStore({ isAuthenticated: false, user: {} });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(loginRequests(actions)).toHaveLength(0);
		expect(jest.mocked(checkAndReopen)).not.toHaveBeenCalled();
	});

	it('takes the authenticated reconnect path without a heal loginRequest', async () => {
		const { store, actions } = setupStore({ isAuthenticated: true, user: { id: 'u-me', token: TOKEN } });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(loginRequests(actions)).toHaveLength(0);
		expect(jest.mocked(checkAndReopen)).toHaveBeenCalledTimes(1);
	});
});
