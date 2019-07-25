import { SHARE } from '../actions/actionsTypes';

const initialState = {
	user: {},
	server: '',
	serverInfo: {}
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
		case SHARE.SET_SERVER_INFO:
			return {
				...state,
				serverInfo: action.serverInfo
			};
		default:
			return state;
	}
}
