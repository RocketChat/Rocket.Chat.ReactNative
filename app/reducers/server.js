import { SERVER } from '../actions/actionsTypes';

const initialState = {
	connecting: false,
	connected: false,
	failure: false,
	server: '',
	loading: true,
	adding: true
};


export default function server(state = initialState, action) {
	switch (action.type) {
		case SERVER.REQUEST:
			return {
				...state,
				connecting: true,
				failure: false,
				adding: true
			};
		case SERVER.FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				failure: true,
				adding: false
			};
		case SERVER.SELECT_REQUEST:
			return {
				...state,
				server: action.server,
				connecting: true,
				connected: false,
				loading: true
			};
		case SERVER.SELECT_SUCCESS:
			return {
				...state,
				server: action.server,
				connecting: false,
				connected: true,
				loading: false
			};
		default:
			return state;
	}
}
