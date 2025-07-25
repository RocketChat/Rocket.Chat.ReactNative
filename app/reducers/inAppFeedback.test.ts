import { removeInAppFeedback, setInAppFeedback, clearInAppFeedback } from '../actions/inAppFeedback';
import { mockedStore } from './mockedStore';
import { initialState } from './inAppFeedback';

describe('test inAppFeedback reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().inAppFeedback;
		expect(state).toEqual(initialState);
	});

	const msgId01 = 'msgId01';
	const msgId02 = 'msgId02';
	it('should return modified store after setInAppFeedback', () => {
		const resultExpected = { [msgId01]: msgId01, [msgId02]: msgId02 };
		mockedStore.dispatch(setInAppFeedback(msgId01));
		mockedStore.dispatch(setInAppFeedback(msgId02));
		const state = mockedStore.getState().inAppFeedback;
		expect(state).toEqual(resultExpected);
	});

	it('should return modified store after removeInAppFeedback', () => {
		const resultExpected = { [msgId02]: msgId02 };
		mockedStore.dispatch(removeInAppFeedback(msgId01));
		const state = mockedStore.getState().inAppFeedback;
		expect(state).toEqual(resultExpected);
	});

	it('should return empty store after clearInAppFeedback', () => {
		mockedStore.dispatch(clearInAppFeedback());
		const state = mockedStore.getState().inAppFeedback;
		expect(state).toEqual(initialState);
	});
});
