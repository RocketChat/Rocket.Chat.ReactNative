import * as types from '../constants/types';

const initialState = {
	settings: {}
};

export default function settings(state = initialState, action) {
	switch (action.type) {
		case types.SET_ALL_PERMISSIONS:
			return {
				...state,
				...action.payload
			};
		default:
			return state;
	}
}
