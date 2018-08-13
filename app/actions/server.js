import { SERVER } from './actionsTypes';

export function selectServerRequest(server) {
	return {
		type: SERVER.SELECT_REQUEST,
		server
	};
}

export function selectServerSuccess(server) {
	return {
		type: SERVER.SELECT_SUCCESS,
		server
	};
}

export function serverRequest(server) {
	return {
		type: SERVER.REQUEST,
		server
	};
}

export function serverSuccess() {
	return {
		type: SERVER.SUCCESS
	};
}

export function serverFailure(err) {
	return {
		type: SERVER.FAILURE,
		err
	};
}
