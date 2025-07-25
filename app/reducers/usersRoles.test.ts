import { setUsersRoles } from '../actions/usersRoles';
import { mockedStore } from './mockedStore';
import { TUsersRoles, initialState } from './usersRoles';

describe('test userRoles reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().usersRoles;
		expect(state).toEqual(initialState);
	});

	it('should return correctly value after call setUserRoles action', () => {
		const usersRoles: TUsersRoles = [{ _id: '1', roles: ['admin'], username: 'admin' }];
		mockedStore.dispatch(setUsersRoles(usersRoles));
		const state = mockedStore.getState().usersRoles;
		expect(state).toEqual(usersRoles);
	});
});
