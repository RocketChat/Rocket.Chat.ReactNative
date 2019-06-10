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
	switch (action.type) {
		case NOTIFICATION.RECEIVED:
			return {
				...state,
				...action.payload
			};
		case NOTIFICATION.REMOVE:
			return initialState;
		default:
			return state;
	}
}
