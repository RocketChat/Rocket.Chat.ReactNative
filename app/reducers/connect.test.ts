import { connectRequest, connectSuccess, disconnect } from '../actions/connect';
import { initialState } from './connect';
import { mockedStore } from './mockedStore';

describe('test reducer', () => {
	it('should return initial state', () => {
		const { meteor } = mockedStore.getState();
		expect(meteor).toEqual(initialState);
	});

	it('should return correct meteor state after dispatch connectRequest action', () => {
		mockedStore.dispatch(connectRequest());
		const { meteor } = mockedStore.getState();
		expect(meteor).toEqual({ connecting: true, connected: false });
	});

	it('should return correct meteor state after dispatch connectSuccess action', () => {
		mockedStore.dispatch(connectSuccess());
		const { meteor } = mockedStore.getState();
		expect(meteor).toEqual({ connecting: false, connected: true });
	});

	it('should return correct meteor state after dispatch disconnect action', () => {
		mockedStore.dispatch(disconnect());
		const { meteor } = mockedStore.getState();
		expect(meteor).toEqual(initialState);
	});
});
