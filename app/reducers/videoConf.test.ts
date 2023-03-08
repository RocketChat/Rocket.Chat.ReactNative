import { clearVideoConfCalls, removeVideoConfCall, setVideoConfCall } from '../actions/videoConf';
import { mockedStore } from './mockedStore';
import { initialState, ICallInfo } from './videoConf';

describe('test videoConf reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().settings;
		expect(state).toEqual(initialState);
	});

	const call1: ICallInfo = {
		callId: '123',
		rid: '123',
		type: 'accepted',
		uid: '123'
	};

	const call2: ICallInfo = {
		callId: '321',
		rid: '321',
		type: 'accepted',
		uid: '321'
	};

	it('should return call1 after call addSettings action with call1 as parameter', () => {
		mockedStore.dispatch(setVideoConfCall(call1));
		const state = mockedStore.getState().videoConf;
		expect(state[call1.callId]).toEqual(call1);
	});

	it('should return call2 after call addSettings action with call2 as parameter', () => {
		mockedStore.dispatch(setVideoConfCall(call2));
		const state = mockedStore.getState().videoConf;
		expect(state[call2.callId]).toEqual(call2);
	});

	it('should remove call1 after call removeVideoConfCall action with call1 as parameter', () => {
		mockedStore.dispatch(removeVideoConfCall(call1));
		const state = mockedStore.getState().videoConf;
		expect(state[call1.callId]).toEqual(undefined);
	});

	it('should return initial state after clearSettings', () => {
		mockedStore.dispatch(clearVideoConfCalls());
		const state = mockedStore.getState().videoConf;
		expect(state).toEqual({});
	});
});
