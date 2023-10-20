import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { TActionTroubleshootingNotification } from '../actions/troubleshootingNotification';

export interface ITroubleshootingNotification {
	deviceNotificationEnabled: boolean;
	isCommunityEdition: boolean;
	isPushGatewayConnected: boolean;
	isCustomPushGateway: boolean;
	consumptionPercentage: number;
	inAlertNotification: boolean;
}

export const initialState: ITroubleshootingNotification = {
	consumptionPercentage: 0,
	deviceNotificationEnabled: false,
	isCommunityEdition: false,
	isPushGatewayConnected: false,
	isCustomPushGateway: false,
	inAlertNotification: false
};

export default (state = initialState, action: TActionTroubleshootingNotification): ITroubleshootingNotification => {
	switch (action.type) {
		case TROUBLESHOOTING_NOTIFICATION.SET:
			return {
				...state,
				...action.payload
			};
		case TROUBLESHOOTING_NOTIFICATION.SET_IN_ALERT:
			return {
				...state,
				...action.payload
			};
		default:
			return state;
	}
};
