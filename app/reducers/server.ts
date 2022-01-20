import { TApplicationActions } from '../definitions';
import { SERVER } from '../actions/actionsTypes';

export interface IServer {
	connecting: boolean;
	connected: boolean;
	failure: boolean;
	server: string;
	version: string | null;
	loading: boolean;
	previousServer: string | null;
	changingServer: boolean;
}

export const initialState: IServer = {
	connecting: false,
	connected: false,
	failure: false,
	server: '',
	version: null,
	loading: true,
	previousServer: null,
	changingServer: false
};

export default function server(state = initialState, action: TApplicationActions): IServer {
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
				loading: true,
				changingServer: action.changeServer
			};
		case SERVER.SELECT_SUCCESS:
			return {
				...state,
				server: action.server,
				version: action.version,
				connecting: false,
				connected: true,
				loading: false,
				changingServer: false
			};
		case SERVER.SELECT_FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				loading: false,
				changingServer: false
			};
		case SERVER.INIT_ADD:
			return {
				...state,
				previousServer: action.previousServer
			};
		case SERVER.FINISH_ADD:
			return {
				...state,
				previousServer: null
			};
		default:
			return state;
	}
}
