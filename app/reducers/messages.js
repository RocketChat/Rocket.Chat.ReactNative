import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	message: {},
	editing: false,
	permalink: ''
};

export default function messages(state = initialState, action) {
	switch (action.type) {
		case types.MESSAGES.REQUEST:
			return {
				...state,
				isFetching: true
			};
		case types.MESSAGES.SUCCESS:
			return {
				...state,
				isFetching: false
			};
		case types.LOGIN.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				errorMessage: action.err
			};
		case types.MESSAGES.EDIT_INIT:
			return {
				...state,
				message: action.message,
				editing: true
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
		case types.MESSAGES.PERMALINK_SUCCESS:
			return {
				...state,
				permalink: action.permalink
			};
		case types.MESSAGES.SET_INPUT:
			return {
				...state,
				message: action.message
			};
		// case types.LOGOUT:
		// 	return initialState;
		default:
			return state;
	}
}
