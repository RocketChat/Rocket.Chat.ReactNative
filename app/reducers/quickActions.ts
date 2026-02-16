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

interface IQuickActionPayloadAction extends Action {
	payload: {
		action: string;
	};
}

type QuickActionsAction = IQuickActionPayloadAction | Action;

export default function quickActions(state = initialState, action: QuickActionsAction): IQuickActionsState {
	switch (action.type) {
		case QUICK_ACTIONS.QUICK_ACTION_HANDLE:
			if (!('payload' in action) || !action.payload?.action) {
				return state;
			}
			return {
				...state,
				lastAction: (action as IQuickActionPayloadAction).payload.action,
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
