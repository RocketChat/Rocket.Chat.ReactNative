import { SERVER } from '../actions/actionsTypes';

export default function server(state = '', action) {
	switch (action.type) {
		case SERVER.SELECT:
			return action.server;
		default:
			return state;
	}
}
