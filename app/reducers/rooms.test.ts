import { roomsFailure, roomsRefresh, roomsRequest, roomsSuccess } from '../actions/rooms';
import { mockedStore } from './mockedStore';
import { initialState } from './rooms';

describe('test selectedUsers reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().rooms;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after call roomsRequest', () => {
		mockedStore.dispatch(roomsRequest());
		const state = mockedStore.getState().rooms;
		const manipulated = { ...initialState, isFetching: true, failure: false, errorMessage: {} };
		expect(state).toEqual(manipulated);
	});

	it('should return modified store after call roomsSuccess', () => {
		mockedStore.dispatch(roomsSuccess());
		const state = mockedStore.getState().rooms;
		const manipulated = { ...initialState, isFetching: false, refreshing: false };
		expect(state).toEqual(manipulated);
	});

	it('should return modified store after call roomsRefresh', () => {
		mockedStore.dispatch(roomsRefresh());
		const state = mockedStore.getState().rooms;
		const manipulated = { ...initialState, isFetching: true, refreshing: true };
		expect(state).toEqual(manipulated);
	});

	it('should return modified store after call roomsFailure', () => {
		mockedStore.dispatch(roomsFailure('error'));
		const state = mockedStore.getState().rooms;
		expect(state.errorMessage).toEqual('error');
	});
});
