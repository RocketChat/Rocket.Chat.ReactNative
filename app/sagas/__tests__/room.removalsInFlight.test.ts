jest.mock('~/lib/services/restApi', () => ({
	leaveRoom: jest.fn(),
	deleteRoom: jest.fn(),
	leaveTeam: jest.fn(),
	deleteTeam: jest.fn(),
	forwardLivechat: jest.fn(),
	emitTyping: jest.fn()
}));

jest.mock('~/lib/navigation/appNavigation', () => ({
	popToTop: jest.fn(),
	navigate: jest.fn()
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	getIsMasterDetail: jest.fn(() => false)
}));

jest.mock('~/lib/methods/helpers/info', () => ({
	showErrorAlert: jest.fn()
}));

jest.mock('~/lib/methods/getMoreMessages', () => jest.fn());

jest.mock('~/lib/database/services/Message', () => ({
	getMessageById: jest.fn()
}));

import { Alert } from 'react-native';
import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { deleteRoom, forwardRoom, leaveRoom, removedRoom } from '~/actions/room';
import { ERoomType } from '~/definitions/ERoomType';
import reducers from '~/reducers';
import { deleteRoom as deleteRoomRequest, forwardLivechat, leaveRoom as leaveRoomRequest } from '~/lib/services/restApi';
import roomRootSaga from '../room';

const room = { rid: 'room-a', t: 'c' } as Parameters<typeof leaveRoom>[1];
const otherRoom = { rid: 'room-b', t: 'c' } as Parameters<typeof deleteRoom>[1];
const transferData = { roomId: 'room-a', departmentId: 'department-1' };

function setupStoreWithRoomSaga() {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(roomRootSaga);
	return store;
}

function hangingRequest() {
	let reject: (reason: unknown) => void = () => undefined;
	let resolve: (value: unknown) => void = () => undefined;
	const promise = new Promise((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise: promise as never, resolve, reject };
}

async function settleSagas(): Promise<void> {
	await jest.advanceTimersByTimeAsync(0);
}

describe('room saga — removals in flight', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
		jest.mocked(leaveRoomRequest).mockReset();
		jest.mocked(deleteRoomRequest).mockReset();
		jest.mocked(forwardLivechat).mockReset();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('counts the leave until the request fails', async () => {
		jest.mocked(leaveRoomRequest).mockRejectedValue({ data: { errorType: 'error-you-are-last-owner' } });
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		expect(store.getState().room.removalsInFlight).toEqual({ 'room-a': 1 });
		await settleSagas();

		expect(Alert.alert).toHaveBeenCalled();
		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('ends the leave when the request answers without success', async () => {
		jest.mocked(leaveRoomRequest).mockResolvedValue({ success: false } as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('ends a successful leave when the subscriptions stream reports the removal of that room', async () => {
		jest.mocked(leaveRoomRequest).mockResolvedValue({ success: true } as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();
		store.dispatch(removedRoom('room-b'));
		expect(store.getState().room.removalsInFlight).toEqual({ 'room-a': 1 });

		store.dispatch(removedRoom('room-a'));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('ends a successful leave when the subscriptions stream stays silent for 3 seconds', async () => {
		jest.mocked(leaveRoomRequest).mockResolvedValue({ success: true } as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();
		expect(store.getState().room.removalsInFlight).toEqual({ 'room-a': 1 });

		await jest.advanceTimersByTimeAsync(3000);

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('ends the delete when the request fails', async () => {
		jest.mocked(deleteRoomRequest).mockRejectedValue(new Error('network'));
		const store = setupStoreWithRoomSaga();

		store.dispatch(deleteRoom(ERoomType.c, room));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('counts a delete of a team channel, which names its room by _id only, under that room', async () => {
		const request = hangingRequest();
		jest.mocked(deleteRoomRequest).mockReturnValue(request.promise);
		const store = setupStoreWithRoomSaga();

		store.dispatch(deleteRoom(ERoomType.c, { _id: 'team-channel', t: 'c' }));
		await settleSagas();
		expect(deleteRoomRequest).toHaveBeenCalledWith('team-channel', 'c');
		expect(store.getState().room.removalsInFlight).toEqual({ 'team-channel': 1 });

		request.reject(new Error('network'));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('keeps counting a delete of another room when a leave fails', async () => {
		const leave = hangingRequest();
		jest.mocked(leaveRoomRequest).mockReturnValue(leave.promise);
		jest.mocked(deleteRoomRequest).mockReturnValue(hangingRequest().promise);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		store.dispatch(deleteRoom(ERoomType.c, otherRoom));
		leave.reject(new Error('network'));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({ 'room-b': 1 });
	});

	it('keeps counting a delete of the same room when a leave of it fails', async () => {
		const leave = hangingRequest();
		jest.mocked(leaveRoomRequest).mockReturnValue(leave.promise);
		jest.mocked(deleteRoomRequest).mockReturnValue(hangingRequest().promise);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		store.dispatch(deleteRoom(ERoomType.c, room));
		expect(store.getState().room.removalsInFlight).toEqual({ 'room-a': 2 });

		leave.reject(new Error('network'));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({ 'room-a': 1 });
	});

	it('ends a leave that a newer leave replaces', async () => {
		jest.mocked(leaveRoomRequest).mockReturnValueOnce(hangingRequest().promise).mockReturnValueOnce(hangingRequest().promise);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();
		store.dispatch(leaveRoom(ERoomType.c, otherRoom));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({ 'room-b': 1 });
	});

	it('ends the forward when no agent is available', async () => {
		jest.mocked(forwardLivechat).mockResolvedValue(false as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(forwardRoom('room-a', transferData));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('ends the forward when the request fails', async () => {
		jest.mocked(forwardLivechat).mockRejectedValue({ reason: 'error' });
		const store = setupStoreWithRoomSaga();

		store.dispatch(forwardRoom('room-a', transferData));
		await settleSagas();

		expect(store.getState().room.removalsInFlight).toEqual({});
	});

	it('ends a successful forward when the subscriptions stream stays silent for 3 seconds', async () => {
		jest.mocked(forwardLivechat).mockResolvedValue(true as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(forwardRoom('room-a', transferData));
		await settleSagas();
		expect(store.getState().room.removalsInFlight).toEqual({ 'room-a': 1 });

		await jest.advanceTimersByTimeAsync(3000);

		expect(store.getState().room.removalsInFlight).toEqual({});
	});
});
