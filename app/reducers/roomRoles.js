import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	roles: []
};

export default function login(state = initialState, action) {
	switch (action.type) {
		case types.ROOM_ROLES.REQUEST:
			return {
				...state,
				isFetching: true,
				roles: []
			};
		case types.ROOM_ROLES.SUCCESS:
			return {
				...state,
				isFetching: false,
				roles: action.roles
			};
		case types.ROOM_ROLES.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				roles: []
			};
		default:
			return state;
	}
}
