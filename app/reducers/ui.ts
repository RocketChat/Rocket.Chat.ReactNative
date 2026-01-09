import { type Action } from 'redux';

import { UI } from '../actions/actionsTypes';

export interface IUIState {
	triggerSearch: boolean;
}

export const initialState: IUIState = {
	triggerSearch: false
};

export default function ui(state = initialState, action: Action): IUIState {
	switch (action.type) {
		case UI.TRIGGER_SEARCH:
			return {
				...state,
				triggerSearch: true
			};
		case UI.CLEAR_TRIGGERED_SEARCH:
			return {
				...state,
				triggerSearch: false
			};
		default:
			return state;
	}
}
