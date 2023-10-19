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
			inAlert: false,
			isCommunityEdition: true,
			isCustomPushGateway: true,
			isPushGatewayConnected: true
		};
		mockedStore.dispatch(setTroubleshootingNotification(payload));
		const state = mockedStore.getState().troubleshootingNotification;
		expect(state).toEqual(payload);
	});
	it('should return correctly the inAlert value after call setInAlert action', () => {
		const previousInAlertState = mockedStore.getState().troubleshootingNotification.inAlert;
		const payload: Pick<ITroubleshootingNotification, 'inAlert'> = {
			inAlert: !previousInAlertState
		};
		mockedStore.dispatch(setInAlertTroubleshootingNotification(payload));
		const newInAlertState = mockedStore.getState().troubleshootingNotification.inAlert;
		expect(newInAlertState).toEqual(payload.inAlert);
	});
});
