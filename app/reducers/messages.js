import * as types from '../actions/actionsTypes';

const initialState = {
	message: {},
	actionMessage: {},
	replyMessage: {},
	replying: false,
	editing: false,
	showActions: false,
	showErrorActions: false,
	showReactionPicker: false
};

export default function messages(state = initialState, action) {
	switch (action.type) {
		case types.MESSAGES.ACTIONS_SHOW:
			return {
				...state,
				showActions: true,
				actionMessage: action.actionMessage
			};
		case types.MESSAGES.ACTIONS_HIDE:
			return {
				...state,
				showActions: false
			};
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
		case types.MESSAGES.EDIT_INIT:
			return {
				...state,
				message: action.message,
				editing: true
			};
		case types.MESSAGES.EDIT_CANCEL:
			return {
				...state,
				message: {},
				editing: false
			};
		case types.MESSAGES.EDIT_SUCCESS:
			return {
				...state,
				message: {},
				editing: false
			};
		case types.MESSAGES.EDIT_FAILURE:
			return {
				...state,
				message: {},
				editing: false
			};
		case types.MESSAGES.REPLY_INIT:
			return {
				...state,
				replyMessage: {
					...action.message,
					mention: action.mention
				},
				replying: true
			};
		case types.MESSAGES.REPLY_CANCEL:
			return {
				...state,
				replyMessage: {},
				replying: false
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
