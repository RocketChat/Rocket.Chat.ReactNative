import { type Action } from 'redux';

import { DEEP_LINKING } from '../actions/actionsTypes';

interface IQuickActionsState {
	lastAction: string | null;
	handled: boolean;
}
export const initialState: IQuickActionsState = {
	lastAction: null,
	handled: false
};

interface IQuickActionAction extends Action<typeof DEEP_LINKING.QUICK_ACTION> {
	payload: {
		action: string;
	};
}

type QuickActionsAction = IQuickActionAction | Action;

export default function quickActions(state = initialState, action: QuickActionsAction) {
	switch (action.type) {
		case DEEP_LINKING.QUICK_ACTION:
			console.log('call to reducer quick action');
			return {
				...state,
				lastAction: (action as IQuickActionAction).payload.action,
				handled: false
			};
		case DEEP_LINKING.QUICK_ACTION_HANDLED:
			return {
				...state,
				handled: true
			};
		default:
			return state;
	}
}
