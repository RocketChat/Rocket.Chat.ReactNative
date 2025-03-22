import { clearVideoConfCalls, removeVideoConfCall, setVideoConfCall, setCalling } from '../actions/videoConf';
import { mockedStore } from './mockedStore';
import { initialState, ICallInfo } from './videoConf';

describe('test videoConf reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().videoConf;
		expect(state).toEqual(initialState);
	});

	const call1: ICallInfo = {
		callId: '123',
		rid: '123',
		action: 'accepted',
		uid: '123'
	};

	const call2: ICallInfo = {
		callId: '321',
		rid: '321',
		action: 'accepted',
		uid: '321'
	};

	it('should return call1 after call addSettings action with call1 as parameter', () => {
		mockedStore.dispatch(setVideoConfCall(call1));
		const state = mockedStore.getState().videoConf;
		const call = state.calls.find(c => c.callId === call1.callId);
		expect(call).toEqual(call1);
	});

	it('should return call2 after call addSettings action with call2 as parameter', () => {
		mockedStore.dispatch(setVideoConfCall(call2));
		const state = mockedStore.getState().videoConf;
		const call = state.calls.find(c => c.callId === call2.callId);
		expect(call).toEqual(call2);
	});

	it('should remove call1 after call removeVideoConfCall action with call1 as parameter', () => {
		mockedStore.dispatch(removeVideoConfCall(call1));
		const state = mockedStore.getState().videoConf;
		const call = state.calls.find(c => c.callId === call1.callId);
		expect(call).toEqual(undefined);
	});

	it('should set calling true after call setCalling action with true as parameter', () => {
		mockedStore.dispatch(setCalling(true));
		const state = mockedStore.getState().videoConf;
		expect(state.calling).toEqual(true);
	});

	it('should set calling false after call setCalling action with false as parameter', () => {
		mockedStore.dispatch(setCalling(false));
		const state = mockedStore.getState().videoConf;
		expect(state.calling).toEqual(false);
	});

	it('should return initial state after clearSettings', () => {
		mockedStore.dispatch(clearVideoConfCalls());
		const state = mockedStore.getState().videoConf;
		expect(state).toEqual(initialState);
	});
});
