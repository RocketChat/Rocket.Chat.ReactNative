import * as types from '../actions/actionsTypes';

const initialState = {
	message: '',
	payload: null
};

export default function notification(state = initialState, action) {
	if (action.type === types.NOTIFICATION.RECEIVED) {
		return {
			...state,
			...action.payload
		};
	} else if (action.type === types.NOTIFICATION.REMOVE) {
		return initialState;
	}

	return state;
}
