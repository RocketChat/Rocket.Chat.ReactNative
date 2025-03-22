import { setRoles, updateRoles, removeRoles } from '../actions/roles';
import { mockedStore } from './mockedStore';
import { initialState } from './roles';

describe('test roles reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().roles;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after call setRoles action', () => {
		const roles = { admin: 'enabled', user: 'enabled', dog: 'carlitos' };
		mockedStore.dispatch(setRoles(roles));
		const state = mockedStore.getState().roles;
		expect(state.admin).toEqual('enabled');
		expect(state.user).toEqual('enabled');
		expect(state.dog).toEqual('carlitos');
	});

	it('should return modified store after call updateRoles action', () => {
		mockedStore.dispatch(updateRoles('admin', 'disabled'));
		const state = mockedStore.getState().roles;
		expect(state.admin).toEqual('disabled');
		expect(state.user).toEqual('enabled');
		expect(state.dog).toEqual('carlitos');
	});

	it('should return modified store after call removeRoles action', () => {
		mockedStore.dispatch(removeRoles('dog'));
		const state = mockedStore.getState().roles;
		expect(state.admin).toEqual('disabled');
		expect(state.user).toEqual('enabled');
		expect(state.dog).toEqual(undefined);
	});
});
