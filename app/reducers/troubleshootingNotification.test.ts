import { setInAlertTroubleshootingNotification, setTroubleshootingNotification } from '../actions/troubleshootingNotification';
import { mockedStore } from './mockedStore';
import { ITroubleshootingNotification, initialState } from './troubleshootingNotification';

describe('test troubleshootingNotification reducer', () => {
	it('should return initial state', () => {
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(initialState);
	});

	it('should return correctly value after call troubleshootingNotification action', () => {
		const payload: ITroubleshootingNotification = {
			consumptionPercentage: 50,
			deviceNotificationEnabled: true,
			inAlertNotification: false,
			isCommunityEdition: true,
			isCustomPushGateway: true,
			isPushGatewayConnected: true
		};
		mockedStore.dispatch(setTroubleshootingNotification(payload));
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(payload);
	});
	it('should return correctly the inAlert value after call setInAlert action', () => {
		const previousInAlertState = mockedStore.getState().troubleshootingNotification.inAlertNotification;
		const payload: Pick<ITroubleshootingNotification, 'inAlertNotification'> = {
			inAlertNotification: !previousInAlertState
		};
		mockedStore.dispatch(setInAlertTroubleshootingNotification(payload));
		const newInAlertState = mockedStore.getState().troubleshootingNotification.inAlertNotification;
		expect(newInAlertState).toEqual(payload.inAlertNotification);
	});
});
