import {
	inquiryFailure,
	inquiryQueueAdd,
	inquiryQueueRemove,
	inquiryQueueUpdate,
	inquiryReset,
	inquirySetEnabled,
	inquirySuccess
} from '../actions/inquiry';
import { mockedStore } from '../../../reducers/mockedStore';
import { initialState } from './inquiry';
import { IOmnichannelRoom, OmnichannelSourceType, SubscriptionType } from '../../../definitions';

describe('test inquiry reduce', () => {
	const enabledObj = {
		enabled: true
	};

	const queued: IOmnichannelRoom = {
		_id: '_id',
		rid: 'rid',
		name: 'Rocket Chat',
		ts: new Date(),
		message: 'ola',
		status: 'queued',
		v: {
			_id: 'id-visitor',
			username: 'guest-24',
			token: '123456789',
			status: 'online'
		},
		t: SubscriptionType.OMNICHANNEL,
		queueOrder: '1',
		estimatedWaitingTimeQueue: '0',
		estimatedServiceTimeAt: new Date(),
		source: {
			type: OmnichannelSourceType.WIDGET,
			_updatedAt: new Date(),
			queuedAt: new Date()
		}
	};

	const error = 'Error Test';

	it('should return inital state', () => {
		const state = mockedStore.getState().inquiry;
		expect(state).toEqual(initialState);
	});

	it('should return correct inquiry state after dispatch inquirySetEnabled action', () => {
		mockedStore.dispatch(inquirySetEnabled(enabledObj.enabled));
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual({ ...initialState, ...enabledObj });
	});

	it('after inquiry state is modified, should return inquiry state as initial state after dispatch inquiryReset action', () => {
		mockedStore.dispatch(inquiryReset());
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual(initialState);
	});

	it('should return correct inquiry state after dispatch inquiryQueueAdd action', () => {
		mockedStore.dispatch(inquiryQueueAdd(queued));
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual({ ...initialState, queued: [queued] });
	});

	it('should update correct inquiry state after dispatch inquiryQueueUpdate action', () => {
		const modifiedQueued: IOmnichannelRoom = { ...queued, message: 'inquiryQueueUpdate' };
		mockedStore.dispatch(inquiryQueueUpdate(modifiedQueued));
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual({ ...initialState, queued: [modifiedQueued] });
	});

	it('should remove correct from queue in inquiry state after dispatch inquiryQueueRemove action', () => {
		mockedStore.dispatch(inquiryQueueRemove(queued._id));
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual(initialState);
	});

	it('should return correct inquiry state after dispatch inquirySuccess action', () => {
		mockedStore.dispatch(inquirySuccess([queued]));
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual({ ...initialState, queued: [queued] });
	});

	it('should return correct inquiry state after dispatch inquiryFailure action', () => {
		mockedStore.dispatch(inquiryReset());
		mockedStore.dispatch(inquiryFailure(error));
		const { inquiry } = mockedStore.getState();
		expect(inquiry).toEqual({ ...initialState, error });
	});
});
