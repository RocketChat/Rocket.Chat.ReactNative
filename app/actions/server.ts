import { Action } from 'redux';

import { SERVER } from './actionsTypes';

export interface ISelectServerAction extends Action {
	server: string;
	version: string;
	fetchVersion: boolean;
	changeServer: boolean;
}

interface ISelectServerSuccess extends Action {
	server: string;
	version: string;
	name: string;
}

export interface IServerRequestAction extends Action {
	server: string;
	username: string | null;
	fromServerHistory: boolean;
}

interface IServerInit extends Action {
	previousServer: string;
}

export type TActionServer = ISelectServerAction & ISelectServerSuccess & IServerRequestAction & IServerInit;

export function selectServerRequest(
	server: string,
	version: string,
	fetchVersion = true,
	changeServer = false
): ISelectServerAction {
	return {
		type: SERVER.SELECT_REQUEST,
		server,
		version,
		fetchVersion,
		changeServer
	};
}

export function selectServerSuccess({
	server,
	version,
	name
}: {
	server: string;
	version: string;
	name: string;
}): ISelectServerSuccess {
	return {
		type: SERVER.SELECT_SUCCESS,
		server,
		version,
		name
	};
}

export function selectServerFailure(): Action {
	return {
		type: SERVER.SELECT_FAILURE
	};
}

export function serverRequest(server: string, username: string | null = null, fromServerHistory = false): IServerRequestAction {
	return {
		type: SERVER.REQUEST,
		server,
		username,
		fromServerHistory
	};
}

export function serverSuccess(): Action {
	return {
		type: SERVER.SUCCESS
	};
}

export function serverFailure(): Action {
	return {
		type: SERVER.FAILURE
	};
}

export function serverInitAdd(previousServer: string): IServerInit {
	return {
		type: SERVER.INIT_ADD,
		previousServer
	};
}

export function serverFinishAdd(): Action {
	return {
		type: SERVER.FINISH_ADD
	};
}
