import { type Action } from 'redux';

import { QUICK_ACTIONS } from './actionsTypes';

interface IQuickActionParams {
	action: string;
}
interface IQuickAction extends Action {
	params: Partial<IQuickActionParams>;
}
export function quickActionHandle(params: Partial<IQuickActionParams>): IQuickAction {
	return {
		type: QUICK_ACTIONS.QUICK_ACTION_HANDLE,
		params
	};
}
