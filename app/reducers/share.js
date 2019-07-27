import { SHARE } from '../actions/actionsTypes';

const initialState = {
	user: {},
	server: ''
};

export default function share(state = initialState, action) {
	switch (action.type) {
		case SHARE.SELECT_SERVER:
			return {
				...state,
				server: action.server
			};
		case SHARE.SET_USER:
			return {
				...state,
				user: action.user
			};
		default:
			return state;
	}
}
