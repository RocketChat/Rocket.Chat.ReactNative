import { Action } from 'redux';

import { TROUBLESHOOTING_NOTIFICATION } from './actionsTypes';
import { ITroubleshootingNotification } from '../reducers/troubleshootingNotification';

type TSetTroubleshootingNotification = Action & { payload: ITroubleshootingNotification };

export type TActionTroubleshootingNotification = Action & TSetTroubleshootingNotification;

export function requestTroubleshootingNotification(): Action {
	return {
		type: TROUBLESHOOTING_NOTIFICATION.REQUEST
	};
}

export function setTroubleshootingNotification(payload: ITroubleshootingNotification): TSetTroubleshootingNotification {
	return {
		type: TROUBLESHOOTING_NOTIFICATION.SET,
		payload
	};
}
