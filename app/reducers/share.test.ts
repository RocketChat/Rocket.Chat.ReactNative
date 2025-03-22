import { shareSetParams } from '../actions/share';
import { mockedStore } from './mockedStore';
import { initialState } from './share';

describe('test share reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().share;
		expect(state).toEqual(initialState);
	});

	it('should return correctly updated state after calling setParams action', () => {
		const params: Record<string, any> = {
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
		const params: Record<string, any> = {};
		mockedStore.dispatch(shareSetParams(params));
		const state = mockedStore.getState().share;
		expect(state).toEqual(initialState);
	});
});
