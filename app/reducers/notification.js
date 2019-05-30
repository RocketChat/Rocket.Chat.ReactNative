import { NOTIFICATION } from '../actions/actionsTypes';

const initialState = {
	message: '',
	payload: {
		type: 'p',
		name: '',
		rid: ''
	}
};

export default function notification(state = initialState, action) {
	if (action.type === NOTIFICATION.RECEIVED) {
		return {
			...state,
			...action.payload
		};
	} else if (action.type === NOTIFICATION.REMOVE) {
		return initialState;
	}

	return state;
}
