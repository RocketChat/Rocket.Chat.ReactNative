import * as types from '../actions/actionsTypes';

const initialState = {};

export default (state = initialState, action) => {
	switch (action.type) {
		case types.ACTIVE_USERS.SET:
			return {
				...initialState,
				...action.user
			};
		default:
			return state;
	}
};
