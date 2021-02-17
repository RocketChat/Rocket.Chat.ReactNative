import * as types from '../actions/actionsTypes';

const initialState = {
	permissions: [],
	loading: false,
	error: {}
};

export default function permissions(state = initialState, action) {
	switch (action.types) {
		case types.PERMISSIONS.REQUEST:
			return {
				...state,
				loading: true
			};
		case types.PERMISSIONS.SUCCESS:
			return {
				...state,
				loading: false,
				permissions: action.permissions
			};
		case types.PERMISSIONS.FAILURE:
			return {
				...state,
				loading: false,
				error: action.err
			};
		default:
			return state;
	}
}
