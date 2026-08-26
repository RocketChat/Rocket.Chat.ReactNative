import { shareSetParams } from '../actions/share';
import { mockedStore } from './mockedStore';
import { initialState } from './share';

describe('test share reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().share;
		expect(state).toEqual(initialState);
	});

	it('should return correctly updated state after calling setParams action', () => {
		const params = {
			mediaUris: 'test'
		};
		mockedStore.dispatch(shareSetParams(params));
		const state = mockedStore.getState().share;
		expect(state).toEqual({
			...initialState,
			params
		});
	});

	it('should reset params to an empty object', () => {
		const params = {};
		mockedStore.dispatch(shareSetParams(params));
		const state = mockedStore.getState().share;
		expect(state).toEqual(initialState);
	});
});
