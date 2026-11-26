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
const transferData = { roomId: 'room-a', departmentId: 'department-1' };

function setupStoreWithRoomSaga() {
	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(reducers, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(roomRootSaga);
	return store;
}

async function settleSagas(): Promise<void> {
	await jest.advanceTimersByTimeAsync(0);
}

describe('room saga — removal flag', () => {
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

	it('clears the flag when the leave request fails', async () => {
		jest.mocked(leaveRoomRequest).mockRejectedValue({ data: { errorType: 'error-you-are-last-owner' } });
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		expect(store.getState().room.isDeleting).toBe(true);
		await settleSagas();

		expect(Alert.alert).toHaveBeenCalled();
		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('clears the flag when the leave request answers without success', async () => {
		jest.mocked(leaveRoomRequest).mockResolvedValue({ success: false } as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();

		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('clears the flag when the subscriptions stream does not report the removal within 3 seconds', async () => {
		jest.mocked(leaveRoomRequest).mockResolvedValue({ success: true } as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();
		expect(store.getState().room.isDeleting).toBe(true);

		await jest.advanceTimersByTimeAsync(3000);

		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('keeps the flag until the subscriptions stream reports the removal', async () => {
		jest.mocked(leaveRoomRequest).mockResolvedValue({ success: true } as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(leaveRoom(ERoomType.c, room));
		await settleSagas();
		expect(store.getState().room).toMatchObject({ rid: 'room-a', isDeleting: true });

		store.dispatch(removedRoom());

		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('clears the flag when the delete request fails', async () => {
		jest.mocked(deleteRoomRequest).mockRejectedValue(new Error('network'));
		const store = setupStoreWithRoomSaga();

		store.dispatch(deleteRoom(ERoomType.c, room));
		await settleSagas();

		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('clears the flag when no agent is available to forward to', async () => {
		jest.mocked(forwardLivechat).mockResolvedValue(false as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(forwardRoom('room-a', transferData));
		await settleSagas();

		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('clears the flag when the forward request fails', async () => {
		jest.mocked(forwardLivechat).mockRejectedValue({ reason: 'error' });
		const store = setupStoreWithRoomSaga();

		store.dispatch(forwardRoom('room-a', transferData));
		await settleSagas();

		expect(store.getState().room.isDeleting).toBe(false);
	});

	it('clears the flag after a forward once the subscriptions stream stays silent for 3 seconds', async () => {
		jest.mocked(forwardLivechat).mockResolvedValue(true as never);
		const store = setupStoreWithRoomSaga();

		store.dispatch(forwardRoom('room-a', transferData));
		await settleSagas();
		await jest.advanceTimersByTimeAsync(3000);

		expect(store.getState().room.isDeleting).toBe(false);
	});
});
