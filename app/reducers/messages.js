import * as types from '../actions/actionsTypes';

const initialState = {
	message: {},
	showErrorActions: false,
	showReactionPicker: false
};

export default function messages(state = initialState, action) {
	switch (action.type) {
		case types.MESSAGES.ERROR_ACTIONS_SHOW:
			return {
				...state,
				showErrorActions: true,
				actionMessage: action.actionMessage
			};
		case types.MESSAGES.ERROR_ACTIONS_HIDE:
			return {
				...state,
				showErrorActions: false
			};
		case types.MESSAGES.SET_INPUT:
			return {
				...state,
				message: action.message
			};
		case types.MESSAGES.CLEAR_INPUT:
			return {
				...state,
				message: {}
			};
		case types.MESSAGES.TOGGLE_REACTION_PICKER:
			return {
				...state,
				showReactionPicker: !state.showReactionPicker,
				actionMessage: action.message
			};
		default:
			return state;
	}
}
