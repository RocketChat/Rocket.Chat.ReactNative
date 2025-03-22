import { createChannelRequest, createChannelSuccess, createChannelFailure } from '../actions/createChannel';
import { initialState } from './createChannel';
import { mockedStore } from './mockedStore';

describe('test reducer', () => {
	const data = {
		name: 'test',
		users: ['diego', 'karla'],
		type: true,
		readOnly: true,
		broadcast: true,
		encrypted: true,
		isTeam: true,
		teamId: 'xxx'
	};

	it('should return initial state', () => {
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual(initialState);
	});

	it('should return correct createChannel state after dispatch createChannelRequest action', () => {
		mockedStore.dispatch(createChannelRequest(data));
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual({ isFetching: true, failure: false, error: {}, result: {} });
	});

	it('should return correct createChannel state after dispatch createChannelSuccess action', () => {
		mockedStore.dispatch(createChannelSuccess(data));
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual({ isFetching: false, failure: false, result: { ...data }, error: {} });
	});

	it('should return correct createChannel state after dispatch createChannelFailure action', () => {
		mockedStore.dispatch(createChannelFailure({ err: true }, true));
		const { createChannel } = mockedStore.getState();
		expect(createChannel).toEqual({
			isFetching: false,
			failure: true,
			result: { ...data },
			error: { err: true }
		});
	});
});
