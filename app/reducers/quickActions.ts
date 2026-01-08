import { type Action } from 'redux';

import { QUICK_ACTIONS } from '../actions/actionsTypes';

interface IQuickActionsState {
	lastAction: string | null;
	handled: boolean;
	pending: string | null;
	launchedFromQuickAction: boolean;
}

export const initialState: IQuickActionsState = {
	lastAction: null,
	handled: false,
	pending: null,
	launchedFromQuickAction: false
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
			console.log('call to reducer quick action');
			if (!('payload' in action) || !action.payload?.action) {
				return state;
			}
			return {
				...state,
				lastAction: (action as IQuickActionPayloadAction).payload.action,
				handled: false
			};

		case QUICK_ACTIONS.SET_PENDING_QUICK_ACTION:
			if (!('payload' in action) || !action.payload?.action) {
				return state;
			}
			return {
				...state,
				pending: (action as IQuickActionPayloadAction).payload.action
			};

		case QUICK_ACTIONS.QUICK_ACTION_HANDLED:
			return {
				...state,
				handled: true,
				pending: null
			};

		case QUICK_ACTIONS.MARK_LAUNCHED_FROM_QUICK_ACTION:
			return {
				...state,
				launchedFromQuickAction: true
			};

		case QUICK_ACTIONS.CLEAR_PENDING:
			return {
				...state,
				pending: null,
				launchedFromQuickAction: false
			};

		default:
			return state;
	}
}
