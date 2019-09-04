import * as types from '../actions/actionsTypes';

const initialState = {
	message: {}
};

export default function messages(state = initialState, action) {
	switch (action.type) {
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
		default:
			return state;
	}
}
