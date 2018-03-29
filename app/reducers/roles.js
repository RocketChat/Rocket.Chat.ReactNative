import * as types from '../actions/actionsTypes';

const initialState = {};

export default (state = initialState, action) => {
	switch (action.type) {
		case types.ROLES.SET:
			return {
				...state,
				...action.data
			};
		default:
			return state;
	}
};
