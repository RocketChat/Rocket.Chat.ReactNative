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

export function selectServerFailure() {
	return {
		type: SERVER.SELECT_FAILURE
	};
}

export function serverRequest(server, certificate = null, username = null, fromServerHistory = false) {
	return {
		type: SERVER.REQUEST,
		server,
		certificate,
		username,
		fromServerHistory
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

export function serverInitAdd(previousServer) {
	return {
		type: SERVER.INIT_ADD,
		previousServer
	};
}

export function serverFinishAdd() {
	return {
		type: SERVER.FINISH_ADD
	};
}
