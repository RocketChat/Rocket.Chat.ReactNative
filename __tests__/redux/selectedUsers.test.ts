import { addUser } from '../../app/actions/selectedUsers';
import { mockedStore } from '../../__mocks__/mockedStore';

describe('test reducer', () => {
	const initialState = {
		users: [],
		loading: false
	};
	it('should return initial state', async () => {
		const state = mockedStore.getState().selectedUsers;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after action', async () => {
		const user = { _id: 'user.id', name: 'user.username', fname: 'user.name' };
		mockedStore.dispatch(addUser(user));
		const state = mockedStore.getState().selectedUsers;
		expect(state).toEqual({ loading: false, users: [user] });
	});
});
