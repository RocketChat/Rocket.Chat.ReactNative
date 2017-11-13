import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false
};

export default function login(state = initialState, action) {
	switch (action.type) {
		case types.ROOMS.REQUEST:
			return {
				...state,
				isFetching: true
			};
		case types.ROOMS.SUCCESS:
			return {
				...state,
				isFetching: false
			};
		case types.ROOMS.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				errorMessage: action.err
			};
		// case types.LOGOUT:
		// 	return initialState;
		default:
			return state;
	}
}
