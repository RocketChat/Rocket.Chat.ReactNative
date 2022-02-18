import {
	inquiryFailure,
	inquiryQueueAdd,
	inquiryQueueRemove,
	inquiryQueueUpdate,
	inquiryRequest,
	inquiryReset,
	inquirySetEnabled,
	inquirySuccess
} from '../actions/inquiry';
import { mockedStore } from '../../../reducers/mockedStore';
import { initialState } from './inquiry';

describe('test inquiry reduce', () => {
	it('should return inital state', () => {
		const state = mockedStore.getState().inquiry;
		expect(state).toEqual(initialState);
	});
});
