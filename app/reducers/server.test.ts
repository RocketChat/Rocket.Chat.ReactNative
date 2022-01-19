import { selectServerRequest, selectServerSuccess } from '../actions/server';
import { mockedStore } from './mockedStore';
import { initialState } from './server';

describe('test server reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().server;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after selectServer', () => {
		const server = 'https://open.rocket.chat/';
		mockedStore.dispatch(selectServerRequest(server));
		const state = mockedStore.getState().server.server;
		expect(state).toEqual(server);
	});

	it('should return modified store after selectServerSucess', () => {
		const serverStr = 'https://mobile.rocket.chat/';
		const versionStr = '4.1.0';
		mockedStore.dispatch(selectServerSuccess(serverStr, versionStr));
		const { server, version } = mockedStore.getState().server;
		expect(server).toEqual(serverStr);
		expect(version).toEqual(versionStr);
	});
});
