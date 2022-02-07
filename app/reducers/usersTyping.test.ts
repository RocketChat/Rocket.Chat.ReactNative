import { addUserTyping, removeUserTyping, clearUserTyping } from '../actions/usersTyping';
import { mockedStore } from './mockedStore';
import { initialState } from './usersTyping';

describe('test usersTyping reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().usersTyping;
		expect(state).toEqual(initialState);
	});

	it('should return modified store after addUserTyping', () => {
		mockedStore.dispatch(addUserTyping('diego'));
		mockedStore.dispatch(addUserTyping('carlos'));
		mockedStore.dispatch(addUserTyping('maria'));
		const state = mockedStore.getState().usersTyping;
		expect(state).toEqual(['diego', 'carlos', 'maria']);
	});

	it('should return modified store after removeUserTyping', () => {
		mockedStore.dispatch(removeUserTyping('diego'));
		const state = mockedStore.getState().usersTyping;
		expect(state).toEqual(['carlos', 'maria']);
	});

	it('should return initial state after reset', () => {
		mockedStore.dispatch(clearUserTyping());
		const state = mockedStore.getState().usersTyping;
		expect(state).toEqual(initialState);
	});
});
