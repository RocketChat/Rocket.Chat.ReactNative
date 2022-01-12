import { createDiscussionRequest, createDiscussionSuccess, createDiscussionFailure } from '../actions/createDiscussion';
import { initialState } from './createDiscussion';
import { mockedStore } from './mockedStore';

describe('test reducer', () => {
	it('should return initial state', () => {
		const { createDiscussion } = mockedStore.getState();
		expect(createDiscussion).toEqual(initialState);
	});

	it('should return correct createDiscussion state after dispatch createDiscussionRequest action', () => {
		mockedStore.dispatch(createDiscussionRequest({}));
		const { createDiscussion } = mockedStore.getState();
		expect(createDiscussion).toEqual({ isFetching: true, failure: false, error: {}, result: {} });
	});

	it('should return correct createDiscussion state after dispatch createDiscussionSuccess action', () => {
		mockedStore.dispatch(createDiscussionSuccess({ data: true }));
		const { createDiscussion } = mockedStore.getState();
		expect(createDiscussion).toEqual({ isFetching: false, failure: false, result: { data: true }, error: {} });
	});

	it('should return correct createDiscussion state after dispatch createDiscussionFailure action', () => {
		mockedStore.dispatch(createDiscussionFailure({ err: true }));
		const { createDiscussion } = mockedStore.getState();
		expect(createDiscussion).toEqual({
			isFetching: false,
			failure: true,
			result: { data: true },
			error: { err: true }
		});
	});
});
