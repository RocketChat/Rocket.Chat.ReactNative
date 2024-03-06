import { Action } from 'redux';

import { TROUBLESHOOTING_NOTIFICATION } from './actionsTypes';
import { ITroubleshootingNotification } from '../reducers/troubleshootingNotification';

type TSetTroubleshootingNotification = Action & { payload: Partial<ITroubleshootingNotification> };

export type TActionTroubleshootingNotification = Action & TSetTroubleshootingNotification;

export function initTroubleshootingNotification(): Action {
	return {
		type: TROUBLESHOOTING_NOTIFICATION.INIT
	};
}

export function setTroubleshootingNotification(payload: Partial<ITroubleshootingNotification>): TSetTroubleshootingNotification {
	return {
		type: TROUBLESHOOTING_NOTIFICATION.SET,
		payload
	};
}
