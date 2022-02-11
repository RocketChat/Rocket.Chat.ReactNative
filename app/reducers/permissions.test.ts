import { setPermissions, updatePermission } from '../actions/permissions';
import { mockedStore } from './mockedStore';
import { initialState, IPermissions } from './permissions';

describe('test permissions reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().permissions;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after setPermissions', () => {
		const permissions: IPermissions = { 'add-user-to-any-c-room': ['admin'], 'add-team-channel': ['user'] };
		mockedStore.dispatch(setPermissions(permissions));
		const state = mockedStore.getState().permissions;
		expect(state).toEqual(permissions);
	});

	it('should return empty store after remove user', () => {
		mockedStore.dispatch(updatePermission('add-team-channel', 'owner'));
		const state = mockedStore.getState().permissions;
		expect(state['add-team-channel']).toEqual('owner');
	});
});
