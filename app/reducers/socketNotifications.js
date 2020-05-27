import { TOGGLE_SOCKET_NOTIFICATIONS } from '../actions/actionsTypes';

const initialState = {
	allowSocketNotifications: false
};


export default (state = initialState, action) => {
	switch (action.type) {
		case TOGGLE_SOCKET_NOTIFICATIONS:
			return {
				allowSocketNotifications: action.payload
			};
		default:
			return state;
	}
};
