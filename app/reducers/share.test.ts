import { shareSelectServer, shareSetSettings, shareSetUser } from '../actions/share';
import { mockedStore } from './mockedStore';
import { initialState } from './share';

describe('test share reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().share;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after shareSelectServer', () => {
		const server = {
			server: 'https://open.rocket.chat',
			version: '4.4.0'
		};
		mockedStore.dispatch(shareSelectServer(server));
		const state = mockedStore.getState().share.server;
		expect(state).toEqual(server);
	});

	it('should return modified store after shareSetSettings', () => {
		const settings = {
			Admin: false
		};
		mockedStore.dispatch(shareSetSettings(settings));
		const state = mockedStore.getState().share.settings;
		expect(state).toEqual(settings);
	});

	it('should return modified store after shareSetUser', () => {
		const user = {
			id: 'dig-joy',
			token: 'token',
			username: 'rocket.chat',
			roles: ['admin']
		};
		mockedStore.dispatch(shareSetUser(user));
		const state = mockedStore.getState().share.user;
		expect(state).toEqual(user);
	});
});
