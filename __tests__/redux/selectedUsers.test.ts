import { addUser, reset, setLoading, removeUser } from '../../app/actions/selectedUsers';
import { mockedStore } from '../../__mocks__/mockedStore';

describe('test selectedUsers reducer', () => {
	const initialState = {
		users: [],
		loading: false
	};

	it('should return initial state', async () => {
		const state = mockedStore.getState().selectedUsers;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after addUser', async () => {
		const user = { _id: 'xxx', name: 'xxx', fname: 'xxx' };
		mockedStore.dispatch(addUser(user));
		const state = mockedStore.getState().selectedUsers.users;
		expect(state).toEqual([user]);
	});

	it('should return empty store after remove user', async () => {
		const user = { _id: 'xxx', name: 'xxx', fname: 'xxx' };
		mockedStore.dispatch(removeUser(user));
		const state = mockedStore.getState().selectedUsers.users;
		expect(state).toEqual([]);
	});

	it('should return initialState after reset', async () => {
		mockedStore.dispatch(reset());
		const state = mockedStore.getState().selectedUsers;
		expect(state).toEqual(initialState);
	});

	it('should return loading after call action', async () => {
		const user = { _id: 'user.id', name: 'user.username', fname: 'user.name' };
		mockedStore.dispatch(setLoading(true));
		const state = mockedStore.getState().selectedUsers.loading;
		expect(state).toEqual(true);
	});
});
