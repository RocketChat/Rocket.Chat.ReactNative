import { setTroubleshootingNotification, requestTroubleshootingNotification } from '../actions/troubleshootingNotification';
import { mockedStore } from './mockedStore';
import { ITroubleshootingNotification, initialState } from './troubleshootingNotification';

describe('test troubleshootingNotification reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(initialState);
	});

	it('should return correctly the value after call requestTroubleshootingNotification action', () => {
		mockedStore.dispatch(requestTroubleshootingNotification());
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(initialState);
	});

	it('should return correctly value after call troubleshootingNotification action', () => {
		const payload: ITroubleshootingNotification = {
			deviceNotificationEnabled: true,
			inAlertNotification: false,
			defaultPushGateway: true,
			pushGatewayEnabled: true
		};
		mockedStore.dispatch(setTroubleshootingNotification(payload));
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(payload);
	});
});
