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

jest.mock('../../lib/services/sdk', () => ({
	__esModule: true,
	default: { get: jest.fn() }
}));

jest.mock('../../lib/services/connect', () => ({
	checkAndReopen: jest.fn(),
	getSocketStaleness: jest.fn()
}));

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn(), write: jest.fn(async (cb: () => Promise<void>) => cb()) } }
}));

jest.mock('../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../lib/store/auxStore', () => ({
	store: { getState: jest.fn(() => ({ server: { version: '7.4.0' } })), dispatch: jest.fn() }
}));

// Not under test here, and its import chain pulls untransformable native crypto ESM.
jest.mock('../../lib/methods/readMessages', () => ({ readMessages: jest.fn(() => Promise.resolve()) }));

jest.mock('../../lib/methods/updateMessages', () => jest.fn());
jest.mock('../../lib/methods/loadMessagesForRoom', () => ({ loadMessagesForRoom: jest.fn() }));

import { applyMiddleware, createStore, Middleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import { APP_STATE, ROOMS } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';

const THROTTLE_WINDOW_MS = 60 * 1000;
const RID = 'ROOM_ID';

/** Drains the saga's pending microtasks; the foreground saga is await-only, no timers. */
async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 60; i += 1) {
		await Promise.resolve();
	}
}

function setupStoreWithStateSaga() {
	// Re-require the saga so each test gets a fresh module-level lastRoomsRequestAt.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { default: freshStateRootSaga } = require('../state');

	const roomsRequestActions: Array<{ type: string }> = [];
	const roomsRequestSpyMiddleware: Middleware = () => next => action => {
		if (action.type === ROOMS.REQUEST) {
			roomsRequestActions.push(action as { type: string });
		}
		return next(action);
	};

	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(
		reducers,
		{
			login: { isAuthenticated: true, user: { id: 'user1' } },
			meteor: { connected: true },
			app: { root: RootEnum.ROOT_INSIDE, ready: true, foreground: false, background: true },
			server: { server: 'https://open.rocket.chat', version: '7.4.0' },
			room: { rid: '', isDeleting: false, subscribedRoom: RID, historyLoaders: [] }
		} as never,
		applyMiddleware(roomsRequestSpyMiddleware, sagaMiddleware)
	);
	sagaMiddleware.run(freshStateRootSaga);
	return { store, roomsRequestActions };
}

describe('foreground roomsRequest throttle', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('collapses rapid foreground/background cycles to a single rooms-delta request', async () => {
		const { store, roomsRequestActions } = setupStoreWithStateSaga();
		const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();
		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(roomsRequestActions).toHaveLength(1);
		dateNowSpy.mockRestore();
	});

	it('dispatches the delta again after the throttle window', async () => {
		const { store, roomsRequestActions } = setupStoreWithStateSaga();
		const start = 2_000_000;
		const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(start);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		dateNowSpy.mockReturnValue(start + THROTTLE_WINDOW_MS + 1);

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		expect(roomsRequestActions).toHaveLength(2);
		dateNowSpy.mockRestore();
	});
});
