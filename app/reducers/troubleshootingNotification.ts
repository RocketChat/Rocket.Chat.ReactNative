import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { TActionTroubleshootingNotification } from '../actions/troubleshootingNotification';

export interface ITroubleshootingNotification {
	deviceNotificationEnabled: boolean;
	pushGatewayEnabled: boolean;
	defaultPushGateway: boolean;
	inAlertNotification: boolean;
}

export const initialState: ITroubleshootingNotification = {
	deviceNotificationEnabled: false,
	pushGatewayEnabled: false,
	defaultPushGateway: false,
	inAlertNotification: false
	// TODO: This will be used in the near future when the consumption percentage is implemented on the server.
	// consumptionPercentage: 0,
	// isCommunityEdition: false,
};

export default (state = initialState, action: TActionTroubleshootingNotification): ITroubleshootingNotification => {
	switch (action.type) {
		case TROUBLESHOOTING_NOTIFICATION.SET:
			return {
				...state,
				...action.payload
			};
		default:
			return state;
	}
};
