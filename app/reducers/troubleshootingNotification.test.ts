import { setTroubleshootingNotification, initTroubleshootingNotification } from '../actions/troubleshootingNotification';
import { mockedStore } from './mockedStore';
import { ITroubleshootingNotification, initialState } from './troubleshootingNotification';

describe('test troubleshootingNotification reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(initialState);
	});

	it('should return correctly the value after call initTroubleshootingNotification action', () => {
		mockedStore.dispatch(initTroubleshootingNotification());
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(initialState);
	});

	it('should return correctly value after call troubleshootingNotification action', () => {
		const payload: ITroubleshootingNotification = {
			deviceNotificationEnabled: true,
			issuesWithNotifications: false,
			defaultPushGateway: true,
			pushGatewayEnabled: true,
			consumptionPercentage: 0,
			isCommunityEdition: false
		};
		mockedStore.dispatch(setTroubleshootingNotification(payload));
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(payload);
	});
});
