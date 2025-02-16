import type { Action } from 'redux';

import { IN_APP_FEEDBACK } from './actionsTypes';

export type TInAppFeedbackAction = Action & {
	msgId: string;
}

export function setInAppFeedback(msgId: string): TInAppFeedbackAction {
	return {
		type: IN_APP_FEEDBACK.SET,
		msgId
	};
}

export function removeInAppFeedback(msgId: string): TInAppFeedbackAction {
	return {
		type: IN_APP_FEEDBACK.REMOVE,
		msgId
	};
}

export function clearInAppFeedback(): Action {
	return {
		type: IN_APP_FEEDBACK.CLEAR
	};
}
