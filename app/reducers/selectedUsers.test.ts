import { addUser, reset, setLoading, removeUser } from '../actions/selectedUsers';
import { mockedStore } from './mockedStore';
import { initialState } from './selectedUsers';

describe('test selectedUsers reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().selectedUsers;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after addUser', () => {
		const user = { _id: 'xxx', name: 'xxx', fname: 'xxx' };
		mockedStore.dispatch(addUser(user));
		const state = mockedStore.getState().selectedUsers.users;
		expect(state).toEqual([user]);
	});

	it('should return empty store after remove user', () => {
		const user = { _id: 'xxx', name: 'xxx', fname: 'xxx' };
		mockedStore.dispatch(removeUser(user));
		const state = mockedStore.getState().selectedUsers.users;
		expect(state).toEqual([]);
	});

	it('should return initial state after reset', () => {
		mockedStore.dispatch(reset());
		const state = mockedStore.getState().selectedUsers;
		expect(state).toEqual(initialState);
	});

	it('should return loading after call action', () => {
		mockedStore.dispatch(setLoading(true));
		const state = mockedStore.getState().selectedUsers.loading;
		expect(state).toEqual(true);
	});
});
