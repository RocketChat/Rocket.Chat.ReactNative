import {
	deleteRoom,
	forwardRoom,
	leaveRoom,
	removedRoom,
	roomHistoryFinished,
	roomHistoryRequest,
	subscribeRoom,
	unsubscribeRoom
} from '../actions/room';
import { ERoomType } from '../definitions/ERoomType';
import { mockedStore } from './mockedStore';
import { initialState } from './room';

describe('test room reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().room;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after subscribeRoom', () => {
		mockedStore.dispatch(subscribeRoom('GENERAL'));
		const state = mockedStore.getState().room;
		expect(state.subscribedRoom).toEqual('GENERAL');
	});

	it('should return empty store after remove unsubscribeRoom', () => {
		mockedStore.dispatch(unsubscribeRoom('GENERAL'));
		const state = mockedStore.getState().room;
		expect(state.subscribedRoom).toEqual('');
	});

	it('should return initial state after leaveRoom', () => {
		mockedStore.dispatch(leaveRoom(ERoomType.c, { rid: ERoomType.c }));
		const { rid, isDeleting } = mockedStore.getState().room;
		expect(rid).toEqual(ERoomType.c);
		expect(isDeleting).toEqual(true);
	});

	it('should return initial state after deleteRoom', () => {
		mockedStore.dispatch(deleteRoom(ERoomType.l, { rid: ERoomType.l }));
		const { rid, isDeleting } = mockedStore.getState().room;
		expect(rid).toEqual(ERoomType.l);
		expect(isDeleting).toEqual(true);
	});

	it('should return initial state after forwardRoom', () => {
		const transferData = { roomId: 'FORWARDING' };
		mockedStore.dispatch(forwardRoom('FORWARDING', transferData));
		const { rid, isDeleting } = mockedStore.getState().room;
		expect(rid).toEqual('FORWARDING');
		expect(isDeleting).toEqual(true);
	});

	it('should return loading after call removedRoom', () => {
		mockedStore.dispatch(removedRoom());
		const { isDeleting } = mockedStore.getState().room;
		expect(isDeleting).toEqual(false);
	});

	it('should return historyLoaders with one item after call historyRequest', () => {
		mockedStore.dispatch(roomHistoryRequest({ rid: 'GENERAL', t: 'c', loaderId: 'loader' }));
		const { historyLoaders } = mockedStore.getState().room;
		expect(historyLoaders).toEqual(['loader']);
	});

	it('should return historyLoaders with empty array after call historyFinished', () => {
		mockedStore.dispatch(roomHistoryFinished({ loaderId: 'loader' }));
		const { historyLoaders } = mockedStore.getState().room;
		expect(historyLoaders).toEqual([]);
	});
});
