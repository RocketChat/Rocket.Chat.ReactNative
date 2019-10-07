import { SET_ACTIVE_USERS } from '../actions/actionsTypes';

const initialState = {};

export default function activeUsers(state = initialState, action) {
	switch (action.type) {
		case SET_ACTIVE_USERS:
			return {
				...state,
				...action.activeUsers
			};
		default:
			return state;
	}
}
