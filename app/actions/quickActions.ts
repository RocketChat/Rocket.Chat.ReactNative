import { type Action } from 'redux';

import { QUICK_ACTIONS } from './actionsTypes';

interface IQuickActionParams {
	type: string;
	action: string;
}
interface IQuickAction extends Action {
	params: Partial<IQuickActionParams>;
}
export function quickActionHandle(params: Partial<IQuickActionParams>): IQuickAction {
	console.log('call to quick actions');
	return {
		type: QUICK_ACTIONS.QUICK_ACTION_HANDLE,
		params
	};
}
