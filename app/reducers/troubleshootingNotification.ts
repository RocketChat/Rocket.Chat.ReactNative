import { TROUBLESHOOTING_NOTIFICATION } from '../actions/actionsTypes';
import { TActionTroubleshootingNotification } from '../actions/troubleshootingNotification';

export interface ITroubleshootingNotification {
	deviceNotificationEnabled: boolean;
	pushGatewayEnabled: boolean;
	defaultPushGateway: boolean;
	highlightTroubleshooting: boolean;
	consumptionPercentage: number;
	isCommunityEdition: boolean;
}

export const initialState: ITroubleshootingNotification = {
	deviceNotificationEnabled: false,
	pushGatewayEnabled: false,
	defaultPushGateway: false,
	highlightTroubleshooting: false,
	consumptionPercentage: 0,
	isCommunityEdition: false
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
