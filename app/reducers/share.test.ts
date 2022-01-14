import { shareSelectServer, shareSetSettings, shareSetUser } from '../actions/share';
import { mockedStore } from './mockedStore';
import { initialState } from './share';

describe('test share reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().share;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after call shareSetUser action', () => {
		const user = { id: 'xxx', token: 'xxx', username: 'diego', roles: ['admin'] };
		mockedStore.dispatch(shareSetUser(user));
		const state = mockedStore.getState().share;
		expect(state.user).toEqual(user);
	});

	it('should return correctly store after call shareSetSettings action', () => {
		const obj = { share: true };
		mockedStore.dispatch(shareSetSettings(obj));
		const { settings } = mockedStore.getState().share;
		expect(settings).toEqual(obj);
	});

	it('should return correctly store after call shareSelectServer action', () => {
		const obj = { server: 'rocket' };
		mockedStore.dispatch(shareSelectServer(obj));
		const { server } = mockedStore.getState().share;
		expect(server).toEqual(obj);
	});
});
