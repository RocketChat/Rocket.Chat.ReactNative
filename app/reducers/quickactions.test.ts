import { mockedStore } from './mockedStore';
import { initialState } from './quickActions';
import { QUICK_ACTIONS } from '../actions/actionsTypes';

describe('test quickActions reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().quickActions;
		expect(state).toEqual(initialState);
	});

	it('should set lastAction and handled=false on QUICK_ACTION_HANDLE', () => {
		mockedStore.dispatch({
			type: QUICK_ACTIONS.QUICK_ACTION_HANDLE,
			payload: {
				action: 'NEW_MESSAGE'
			}
		});

		const state = mockedStore.getState().quickActions;

		expect(state.lastAction).toEqual('NEW_MESSAGE');
		expect(state.handled).toEqual(false);
	});

	it('should not modify state if QUICK_ACTION_HANDLE has no payload', () => {
		const prevState = mockedStore.getState().quickActions;

		mockedStore.dispatch({
			type: QUICK_ACTIONS.QUICK_ACTION_HANDLE
		});

		const state = mockedStore.getState().quickActions;
		expect(state).toEqual(prevState);
	});

	it('should not modify state if QUICK_ACTION_HANDLE payload has no action', () => {
		const prevState = mockedStore.getState().quickActions;

		mockedStore.dispatch({
			type: QUICK_ACTIONS.QUICK_ACTION_HANDLE,
			payload: {}
		});

		const state = mockedStore.getState().quickActions;
		expect(state).toEqual(prevState);
	});

	it('should set handled=true on QUICK_ACTION_HANDLED', () => {
		mockedStore.dispatch({
			type: QUICK_ACTIONS.QUICK_ACTION_HANDLED
		});

		const state = mockedStore.getState().quickActions;
		expect(state.handled).toEqual(true);
	});

	it('should return same state for unknown action', () => {
		const prevState = mockedStore.getState().quickActions;

		mockedStore.dispatch({
			type: 'UNKNOWN_ACTION'
		});

		const state = mockedStore.getState().quickActions;
		expect(state).toEqual(prevState);
	});
});
