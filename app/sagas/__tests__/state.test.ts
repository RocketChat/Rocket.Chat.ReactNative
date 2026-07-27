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
import { readFileSync } from 'fs';
import { join } from 'path';

import reducers from '../../reducers';
import stateRootSaga from '../state';
import { APP_STATE, ROOMS } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import { setUserPresenceOnline } from '../../lib/services/restApi';
import { loadMissedMessages } from '../../lib/methods/loadMissedMessages';
import { readMessages } from '../../lib/methods/readMessages';

const mockedLoadMissedMessages = loadMissedMessages as jest.MockedFunction<typeof loadMissedMessages>;
const mockedReadMessages = readMessages as jest.MockedFunction<typeof readMessages>;

const RID = 'ROOM_ID';

async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 60; i += 1) {
		await Promise.resolve();
	}
}

function setupStore({ connected = true, isAuthenticated = true, subscribedRoom = RID } = {}) {
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
		const { store, dispatched } = setupStore();

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
		const { store, dispatched } = setupStore({ subscribedRoom: '' });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		expect(mockedReadMessages).not.toHaveBeenCalled();
		expect(dispatched.some(action => action.type === ROOMS.REQUEST)).toBe(true);
	});

	it('does nothing while not connected', async () => {
		const { store, dispatched } = setupStore({ connected: false });

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedLoadMissedMessages).not.toHaveBeenCalled();
		expect(mockedReadMessages).not.toHaveBeenCalled();
		expect(dispatched.some(action => action.type === ROOMS.REQUEST)).toBe(false);
		expect(setUserPresenceOnline).not.toHaveBeenCalled();
	});

	it('completes and still sets presence online when the room sync rejects', async () => {
		mockedLoadMissedMessages.mockRejectedValueOnce(new Error('offline'));
		const { store } = setupStore();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(mockedReadMessages).not.toHaveBeenCalled();
		expect(setUserPresenceOnline).toHaveBeenCalled();
	});

	it('no longer reaches into the connection layer to reopen the socket', () => {
		const source = readFileSync(join(__dirname, '..', 'state.js'), 'utf8');
		expect(source).not.toContain('checkAndReopen');
	});
});
