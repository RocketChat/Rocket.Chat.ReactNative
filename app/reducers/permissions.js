import * as types from '../constants/types';

const initialState = {
	permissions: {}
};


export default function permissions(state = initialState.permissions, action) {
	if (action.type === types.SET_ALL_PERMISSIONS) {
		return {
			...state,
			...action.payload
		};
	}

	if (action.type === types.ADD_PERMISSIONS) {
		return {
			...state,
			...action.payload
		};
	}

	return state;
}
