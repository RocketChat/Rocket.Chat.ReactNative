jest.mock('../../lib/methods/helpers/localAuthentication', () => ({
	localAuthenticate: jest.fn(() => Promise.resolve()),
	saveLastLocalAuthenticationSession: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/services/connect', () => ({
	checkAndReopen: jest.fn()
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

import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../../reducers';
import stateRootSaga from '../state';
import { APP_STATE } from '../../actions/actionsTypes';
import { RootEnum } from '../../definitions';
import sdk from '../../lib/services/sdk';
import { setUserPresenceOnline } from '../../lib/services/restApi';
import updateMessages from '../../lib/methods/updateMessages';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

const RID = 'ROOM_ID';
const CURSOR = new Date(Date.UTC(2024, 0, 1, 11, 0, 0));

const backgroundMessage = {
	_id: 'background-1',
	rid: RID,
	msg: 'sent while the app was backgrounded and the socket stayed alive',
	ts: new Date(Date.UTC(2024, 0, 1, 11, 30, 0)).toISOString(),
	_updatedAt: new Date(Date.UTC(2024, 0, 1, 11, 30, 0)).toISOString(),
	u: { _id: 'user2', username: 'user2' }
};

/** Drains the saga's pending microtasks; the foreground saga is await-only, no timers. */
async function flushSagaMicrotasks(): Promise<void> {
	for (let i = 0; i < 60; i += 1) {
		await Promise.resolve();
	}
}

function setupStoreWithStateSaga() {
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
		applyMiddleware(sagaMiddleware)
	);
	sagaMiddleware.run(stateRootSaga);
	return store;
}

describe('foregrounding with a live socket must re-sync the open room', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUpdateMessages.mockResolvedValue(0);
		mockedGetSubscriptionByRoomId.mockResolvedValue({ lastOpen: CURSOR, t: 'c' } as never);
		mockedSdkGet.mockResolvedValue({
			result: { updated: [backgroundMessage], deleted: [], cursor: { next: null } }
		} as never);
	});

	it('fetches messages that arrived during the background window, without any DDP reconnect event', async () => {
		const store = setupStoreWithStateSaga();

		store.dispatch({ type: APP_STATE.FOREGROUND });
		await flushSagaMicrotasks();

		// Control: proves the production foreground saga really ran and passed its guards.
		expect(setUserPresenceOnline).toHaveBeenCalled();

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ roomId: RID }));
		expect(mockedUpdateMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				rid: RID,
				update: expect.arrayContaining([expect.objectContaining({ _id: 'background-1' })])
			})
		);
	});
});
