import { SERVER } from './actionsTypes';

export function selectServerRequest(server, version, fetchVersion = true) {
	return {
		type: SERVER.SELECT_REQUEST,
		server,
		version,
		fetchVersion
	};
}

export function selectServerSuccess(server, version) {
	return {
		type: SERVER.SELECT_SUCCESS,
		server,
		version
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

export function serverInitAdd() {
	return {
		type: SERVER.INIT_ADD
	};
}

export function serverFinishAdd() {
	return {
		type: SERVER.FINISH_ADD
	};
}
