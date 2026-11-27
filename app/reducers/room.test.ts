import {
	deleteRoom,
	forwardRoom,
	leaveRoom,
	removedRoom,
	roomHistoryFinished,
	roomHistoryRequest,
	roomHistoryUiLoaderPop,
	roomHistoryUiLoaderPush,
	roomRemovalFinished,
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

	it('counts a removal in flight after leaveRoom', () => {
		mockedStore.dispatch(leaveRoom(ERoomType.c, { rid: 'LEAVING' }));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({ LEAVING: 1 });
	});

	it('counts a second removal in flight of the same room after deleteRoom', () => {
		mockedStore.dispatch(deleteRoom(ERoomType.c, { rid: 'LEAVING' }));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({ LEAVING: 2 });
	});

	it('counts a removal in flight after forwardRoom', () => {
		mockedStore.dispatch(forwardRoom('FORWARDING', { roomId: 'FORWARDING' }));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({ LEAVING: 2, FORWARDING: 1 });
	});

	it('keeps the removals in flight after removedRoom', () => {
		mockedStore.dispatch(removedRoom('LEAVING'));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({ LEAVING: 2, FORWARDING: 1 });
	});

	it('ends one removal in flight per roomRemovalFinished', () => {
		mockedStore.dispatch(roomRemovalFinished('LEAVING'));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({ LEAVING: 1, FORWARDING: 1 });

		mockedStore.dispatch(roomRemovalFinished('LEAVING'));
		mockedStore.dispatch(roomRemovalFinished('FORWARDING'));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({});
	});

	it('ignores roomRemovalFinished for a room with no removal in flight', () => {
		mockedStore.dispatch(roomRemovalFinished('UNKNOWN'));
		expect(mockedStore.getState().room.removalsInFlight).toEqual({});
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

	it('should append loader id after HISTORY_UI_LOADER_PUSH', () => {
		mockedStore.dispatch(roomHistoryUiLoaderPush({ loaderId: 'ui-loader' }));
		expect(mockedStore.getState().room.historyLoaders).toContain('ui-loader');
	});

	it('should remove loader id after HISTORY_UI_LOADER_POP', () => {
		mockedStore.dispatch(roomHistoryUiLoaderPush({ loaderId: 'pop-me' }));
		mockedStore.dispatch(roomHistoryUiLoaderPop({ loaderId: 'pop-me' }));
		expect(mockedStore.getState().room.historyLoaders).not.toContain('pop-me');
	});
});
