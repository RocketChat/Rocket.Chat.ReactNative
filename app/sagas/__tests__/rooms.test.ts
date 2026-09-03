jest.mock('../../lib/methods/subscribeRooms', () => ({
	subscribeRooms: jest.fn(),
	unsubscribeRooms: jest.fn()
}));

jest.mock('../../lib/methods/getRooms', () => ({
	getRooms: jest.fn()
}));

jest.mock('../../lib/methods/helpers/mergeSubscriptionsRooms', () => ({
	__esModule: true,
	default: jest.fn(async () => [])
}));

jest.mock('../../lib/methods/helpers/buildMessage', () => ({
	__esModule: true,
	default: jest.fn((message: unknown) => message)
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	...jest.requireActual('../../lib/methods/helpers/log'),
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../lib/database', () => {
	const serversCollection = { find: jest.fn() };
	return {
		__esModule: true,
		default: {
			active: { get: jest.fn(), write: jest.fn(), batch: jest.fn() },
			servers: {
				get: jest.fn(() => serversCollection),
				write: jest.fn(async (block: () => Promise<void>) => block())
			}
		}
	};
});

import roomsRoot from '../rooms';
import database from '../../lib/database';
import * as types from '../../actions/actionsTypes';
import { roomsRequest } from '../../actions/rooms';
import { loginSuccess } from '../../actions/login';
import { selectServerRequest, selectServerSuccess } from '../../actions/server';
import { getRooms } from '../../lib/methods/getRooms';
import { subscribeRooms } from '../../lib/methods/subscribeRooms';
import { cancelSagaTasks, createRecordingStore, flushSagaMicrotasks } from '../../lib/testUtils/sagaStore';
import type { RecordingStore } from '../../lib/testUtils/sagaStore';

const SERVER = 'https://open.rocket.chat';
const OTHER_SERVER = 'https://other.rocket.chat';
const USER = { id: 'user-1', token: 'token-1', username: 'user1', name: 'User One' };

const EMPTY_ROOMS_RESULT = [
	{ update: [], remove: [] },
	{ update: [], remove: [] }
];

const serversCollection = (database as any).servers.get('servers') as { find: jest.Mock };

const setupStore = (): RecordingStore => createRecordingStore(roomsRoot);

/** Signs in and selects a server so `root()` lets `ROOMS.REQUEST` through. */
const authenticate = (store: RecordingStore['store']) => {
	store.dispatch(selectServerSuccess({ server: SERVER, version: '7.0.0', name: 'Rocket.Chat' }));
	store.dispatch(loginSuccess(USER));
};

/** Holds `getRooms` open so a sync can be interrupted mid-flight. */
const deferGetRooms = () => {
	let release = () => {};
	jest.mocked(getRooms).mockImplementation(
		() =>
			new Promise(resolve => {
				release = () => resolve(EMPTY_ROOMS_RESULT);
			}) as any
	);
	return () => release();
};

const typesOf = (dispatchedActions: RecordingStore['dispatchedActions']) => dispatchedActions.map(action => action.type);

afterEach(cancelSagaTasks);

describe('rooms saga', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		serversCollection.find.mockRejectedValue(new Error('Server not found'));
		jest.mocked(getRooms).mockResolvedValue(EMPTY_ROOMS_RESULT as any);
	});

	describe('root watcher', () => {
		it('ignores ROOMS.REQUEST while the user is not authenticated', async () => {
			const { store, dispatchedActions } = setupStore();
			store.dispatch(selectServerSuccess({ server: SERVER, version: '7.0.0', name: 'Rocket.Chat' }));

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();

			expect(subscribeRooms).not.toHaveBeenCalled();
			expect(getRooms).not.toHaveBeenCalled();
			expect(typesOf(dispatchedActions)).not.toContain(types.ROOMS.SUCCESS);
		});

		it('runs the sync and dispatches ROOMS.SUCCESS when authenticated', async () => {
			const { store, dispatchedActions } = setupStore();
			authenticate(store);

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();

			expect(subscribeRooms).toHaveBeenCalled();
			expect(getRooms).toHaveBeenCalled();
			expect(typesOf(dispatchedActions)).toContain(types.ROOMS.SUCCESS);
		});

		it('keeps serving requests after a sync finishes', async () => {
			const { store, dispatchedActions } = setupStore();
			authenticate(store);

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();
			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();

			expect(getRooms).toHaveBeenCalledTimes(2);
			expect(dispatchedActions.filter(action => action.type === types.ROOMS.SUCCESS)).toHaveLength(2);
		});
	});

	describe('handleRoomsRequest', () => {
		it('refreshes and skips the roomsUpdatedAt lookup when allData is set', async () => {
			const { store, dispatchedActions } = setupStore();
			authenticate(store);

			store.dispatch(roomsRequest({ allData: true }));
			await flushSagaMicrotasks();

			expect(typesOf(dispatchedActions)).toContain(types.ROOMS.REFRESH);
			expect(getRooms).toHaveBeenCalledWith(undefined);
		});

		it('passes the stored roomsUpdatedAt to getRooms on an incremental sync', async () => {
			const roomsUpdatedAt = new Date('2026-01-01T00:00:00.000Z');
			serversCollection.find.mockResolvedValue({ roomsUpdatedAt, update: jest.fn() });

			const { store, dispatchedActions } = setupStore();
			authenticate(store);

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();

			expect(getRooms).toHaveBeenCalledWith(roomsUpdatedAt);
			expect(typesOf(dispatchedActions)).not.toContain(types.ROOMS.REFRESH);
		});

		it('dispatches ROOMS.FAILURE and leaves the watcher able to serve the next request', async () => {
			jest.mocked(getRooms).mockRejectedValueOnce(new Error('network down'));

			const { store, dispatchedActions } = setupStore();
			authenticate(store);

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();

			expect(typesOf(dispatchedActions)).toContain(types.ROOMS.FAILURE);

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();

			expect(typesOf(dispatchedActions)).toContain(types.ROOMS.SUCCESS);
		});
	});

	describe('cancelling an in-flight sync', () => {
		it.each([
			['the workspace changes', () => selectServerRequest(OTHER_SERVER, '7.0.0')],
			['the user logs out', () => ({ type: types.LOGOUT })],
			['the app goes to background', () => ({ type: types.APP_STATE.BACKGROUND })]
		])('drops the pending sync when %s', async (_label, buildAction) => {
			const releaseGetRooms = deferGetRooms();

			const { store, dispatchedActions } = setupStore();
			authenticate(store);

			store.dispatch(roomsRequest());
			await flushSagaMicrotasks();
			expect(getRooms).toHaveBeenCalled();

			store.dispatch(buildAction() as any);
			await flushSagaMicrotasks();

			releaseGetRooms();
			await flushSagaMicrotasks();

			expect(typesOf(dispatchedActions)).not.toContain(types.ROOMS.SUCCESS);
		});

		/**
		 * `root()` races the sync against `delay(30000)` and then cancels the task
		 * unconditionally, so a sync slower than 30s is dropped without ever
		 * reporting success or failure.
		 */
		it('drops a sync that outruns the 30s timeout, with no success or failure reported', async () => {
			jest.useFakeTimers();
			try {
				const releaseGetRooms = deferGetRooms();

				const { store, dispatchedActions } = setupStore();
				authenticate(store);

				store.dispatch(roomsRequest());
				await flushSagaMicrotasks();
				expect(getRooms).toHaveBeenCalled();

				jest.advanceTimersByTime(30000);
				await flushSagaMicrotasks();

				releaseGetRooms();
				await flushSagaMicrotasks();

				expect(typesOf(dispatchedActions)).not.toContain(types.ROOMS.SUCCESS);
				expect(typesOf(dispatchedActions)).not.toContain(types.ROOMS.FAILURE);
			} finally {
				jest.useRealTimers();
			}
		});
	});
});
