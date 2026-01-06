import { type Action } from 'redux';

import { QUICK_ACTIONS } from '../actions/actionsTypes';

interface IQuickActionsState {
	lastAction: string | null;
	handled: boolean;
}
export const initialState: IQuickActionsState = {
	lastAction: null,
	handled: false
};

interface IQuickActionAction extends Action<typeof QUICK_ACTIONS.QUICK_ACTION_HANDLE> {
	payload: {
		action: string;
	};
}

type QuickActionsAction = IQuickActionAction | Action;

export default function quickActions(state = initialState, action: QuickActionsAction) {
	switch (action.type) {
		case QUICK_ACTIONS.QUICK_ACTION_HANDLE:
			console.log('call to reducer quick action');
			return {
				...state,
				lastAction: (action as IQuickActionAction).payload.action,
				handled: false
			};
		case QUICK_ACTIONS.QUICK_ACTION_HANDLED:
			return {
				...state,
				handled: true
			};
		default:
			return state;
	}
}
