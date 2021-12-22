import { setActiveUsers } from '../actions/activeUsers';
import { IActiveUsers } from './activeUsers';
import { mockedStore } from './mockedStore';

describe('test reducer', () => {
	it('should return {} as initial state', () => {
		const state = mockedStore.getState().activeUsers;
		expect(state).toEqual({});
	});
	it('should return modified store after action', () => {
		const activeUsers: IActiveUsers = { any: { status: 'online', statusText: 'any' } };
		mockedStore.dispatch(setActiveUsers(activeUsers));
		const state = mockedStore.getState().activeUsers;
		expect(state).toEqual({ ...activeUsers });
	});
});
