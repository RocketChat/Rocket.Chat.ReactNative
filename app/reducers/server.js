import { SERVER } from '../actions/actionsTypes';

const initialState = {
	connecting: false,
	connected: false,
	failure: false,
	server: '',
	version: null,
	loading: true,
	adding: false,
	previousServer: null
};


export default function server(state = initialState, action) {
	switch (action.type) {
		case SERVER.REQUEST:
			return {
				...state,
				connecting: true,
				failure: false
			};
		case SERVER.FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				failure: true
			};
		case SERVER.SELECT_REQUEST:
			return {
				...state,
				server: action.server,
				version: action.version,
				connecting: true,
				connected: false,
				loading: true
			};
		case SERVER.SELECT_SUCCESS:
			return {
				...state,
				server: action.server,
				version: action.version,
				connecting: false,
				connected: true,
				loading: false
			};
		case SERVER.SELECT_FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				loading: false
			};
		case SERVER.INIT_ADD:
			return {
				...state,
				adding: true,
				previousServer: action.previousServer
			};
		case SERVER.FINISH_ADD:
			return {
				...state,
				adding: false,
				previousServer: null
			};
		default:
			return state;
	}
}
