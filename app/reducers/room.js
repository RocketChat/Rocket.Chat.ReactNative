import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	roles: [],
	err: {}
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
				err: {}
			};
		default:
			return state;
	}
}
