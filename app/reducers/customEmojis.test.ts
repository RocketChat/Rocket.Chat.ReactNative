import { setCustomEmojis } from '../actions/customEmojis';
import { initialState } from './customEmojis';
import { mockedStore } from './mockedStore';
import { ICustomEmojis } from '../definitions';

describe('test reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().customEmojis;
		expect(state).toEqual(initialState);
	});
	it('should return modified store after action', () => {
		const emojis: ICustomEmojis = { dog: { name: 'dog', extension: 'jpg' }, cat: { name: 'cat', extension: 'jpg' } };
		mockedStore.dispatch(setCustomEmojis(emojis));
		const state = mockedStore.getState().customEmojis;
		expect(state).toEqual(emojis);
	});
});
