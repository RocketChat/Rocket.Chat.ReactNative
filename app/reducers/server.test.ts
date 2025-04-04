import {
	selectServerRequest,
	serverRequest,
	selectServerSuccess,
	serverInitAdd,
	serverFailure,
	serverFinishAdd,
	selectServerFailure
} from '../actions/server';
import { mockedStore } from './mockedStore';
import { initialState } from './server';

describe('test server reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().server;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after serverRequest', () => {
		const server = 'https://open.rocket.chat/';
		mockedStore.dispatch(serverRequest(server));
		const state = mockedStore.getState().server;
		const manipulated = { ...initialState, connecting: true, failure: false };
		expect(state).toEqual(manipulated);
	});

	it('should return modified store after selectServerFailure', () => {
		mockedStore.dispatch(selectServerFailure());
		const state = mockedStore.getState().server;
		const manipulated = { ...initialState, connecting: false, connected: false, loading: false, changingServer: false };
		expect(state).toEqual(manipulated);
	});

	it('should return modified store after selectServer', () => {
		const server = 'https://open.rocket.chat/';
		mockedStore.dispatch(selectServerRequest(server, '4.1.0'));
		const state = mockedStore.getState().server.server;
		expect(state).toEqual(server);
	});

	it('should return modified store after selectServerSucess', () => {
		const server = 'https://open.rocket.chat/';
		const version = '4.1.0';
		const name = 'Rocket.Chat';
		mockedStore.dispatch(selectServerSuccess({ server, version, name: 'Rocket.Chat' }));
		const state = mockedStore.getState().server;
		const manipulated = { ...initialState, server, version, connected: true, loading: false, name };
		expect(state).toEqual(manipulated);
	});

	it('should return modified store after serverRequestInitAdd', () => {
		const previousServer = 'https://mobile.rocket.chat';
		mockedStore.dispatch(serverInitAdd(previousServer));
		const state = mockedStore.getState().server.previousServer;
		expect(state).toEqual(previousServer);
	});

	it('should return modified store after serverFinishAdd', () => {
		mockedStore.dispatch(serverFinishAdd());
		const state = mockedStore.getState().server.previousServer;
		expect(state).toEqual(null);
	});

	it('should return modified store after serverRequestFailure', () => {
		mockedStore.dispatch(serverFailure());
		const state = mockedStore.getState().server;
		expect(state.failure).toEqual(true);
	});
});
