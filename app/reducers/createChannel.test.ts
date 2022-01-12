import { createChannelRequest, createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import { initialState } from './createChannel';
import { mockedStore } from './mockedStore';

describe('test reducer', () => {
	it('should return initial state', () => {
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual(initialState);
	});

	it('should return correct createChannel state after dispatch createChannelRequest action', () => {
		mockedStore.dispatch(createChannelRequest({}));
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual({ isFetching: true, failure: false, error: {}, result: {} });
	});

	it('should return correct createChannel state after dispatch createChannelSuccess action', () => {
		mockedStore.dispatch(createChannelSuccess({ data: true }));
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual({ isFetching: false, failure: false, result: { data: true }, error: {} });
	});

	it('should return correct createChannel state after dispatch createChannelFailure action', () => {
		mockedStore.dispatch(createChannelFailure({ err: true }, true));
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual({
			isFetching: false,
			failure: true,
			result: { data: true },
			error: { err: true }
		});
	});
});
