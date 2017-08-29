import { SERVER } from './actionsTypes';

export function setServer(server) {
	return {
		type: SERVER.SELECT,
		server
	};
}
export function changedServer(server) {
	return {
		type: SERVER.CHANGED,
		server
	};
}
