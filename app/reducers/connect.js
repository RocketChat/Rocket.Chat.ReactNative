import { METEOR } from '../actions/actionsTypes';

const initialState = {
	connecting: false,
	connected: false,
	errorMessage: '',
	disconnected_by_user: false,
	failure: false
};

export default function connect(state = initialState, action) {
	switch (action.type) {
		case METEOR.REQUEST:
			return {
				...state,
				connecting: true,
				disconnected_by_user: false
			};
		case METEOR.SUCCESS:
			return {
				...state,
				connecting: false,
				connected: true,
				failure: false
			};
		case METEOR.FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				failure: true,
				errorMessage: action.err
			};
		case METEOR.DISCONNECT_BY_USER:
			return {
				...state,
				disconnected_by_user: true
			};
		case METEOR.DISCONNECT:
			return initialState;
		default:
			return state;
	}
}
