import { SHARE } from './actionsTypes';

export function shareSelectServer(server) {
	return {
		type: SHARE.SELECT_SERVER,
		server
	};
}

export function shareSetUser(user) {
	return {
		type: SHARE.SET_USER,
		user
	};
}

export function shareSetServerInfo(serverInfo) {
	return {
		type: SHARE.SET_SERVER_INFO,
		serverInfo
	};
}
