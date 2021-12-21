import { setActiveUsers } from '../../app/actions/activeUsers';
import { IActiveUsers } from '../../app/reducers/activeUsers';
import { mockedStore } from '../../__mocks__/mockedStore';

describe('test reducer', () => {
	it('should return {} as initial state', async () => {
		const state = mockedStore.getState().activeUsers;
		expect(state).toEqual({});
	});
	it('should return modified store after action', async () => {
		const activeUsers: IActiveUsers = { any: { status: 'online', statusText: 'any' } };
		mockedStore.dispatch(setActiveUsers(activeUsers));
		const state = mockedStore.getState().activeUsers;
		expect(state).toEqual({ ...activeUsers });
	});
});
