import { SERVER } from '../actions/actionsTypes';

const initialState = {
	connecting: false,
	connected: false,
	errorMessage: '',
	failure: false,
	server: {}
};


export default function server(state = initialState, action) {
	switch (action.type) {
		case SERVER.REQUEST:
			return {
				...state,
				connecting: true,
				failure: false
			};
		case SERVER.SUCCESS:
			return {
				...state,
				connecting: false,
				connected: true,
				failure: false
			};
		case SERVER.FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				failure: true,
				errorMessage: action.err
			};
		case SERVER.SELECT:
			return { ...state, server: action.server };
		default:
			return state;
	}
}
