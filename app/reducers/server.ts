import { TActionServer } from '../actions/server';
import { SERVER } from '../actions/actionsTypes';

export interface IServer {
	connecting: boolean;
	connected: boolean;
	failure: boolean;
	failureMessage?: string;
	server: string;
	version: string;
	name: string | null;
	loading: boolean;
	previousServer: string | null;
	changingServer: boolean;
}

export const initialState: IServer = {
	connecting: false,
	connected: false,
	failure: false,
	server: '',
	version: '',
	name: null,
	loading: true,
	previousServer: null,
	changingServer: false
};

export default function server(state = initialState, action: TActionServer): IServer {
	switch (action.type) {
		case SERVER.REQUEST:
			return {
				...state,
				connecting: true,
				failure: false,
				failureMessage: undefined
			};
		case SERVER.FAILURE:
			return {
				...state,
				connecting: false,
				connected: false,
				failure: true,
				failureMessage: action.failureMessage
			};
		case SERVER.SELECT_CANCEL:
			return {
				...state,
				connecting: false,
				connected: true,
				loading: false,
				changingServer: false
			};
		case SERVER.CLEAR:
			return {
				server: '',
				version: '',
				name: null,
				previousServer: null,
				connecting: false,
				connected: false,
				loading: false,
				changingServer: false,
				failure: false
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
				name: action.name,
				connecting: false,
				connected: true,
				loading: false,
				changingServer: false,
				failureMessage: undefined
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
