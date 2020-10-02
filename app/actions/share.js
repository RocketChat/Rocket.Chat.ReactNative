import { SHARE } from './actionsTypes';

export function shareSelectServer(server) {
	return {
		type: SHARE.SELECT_SERVER,
		server
	};
}

export function shareSetSettings(settings) {
	return {
		type: SHARE.SET_SETTINGS,
		settings
	};
}

export function shareSetUser(user) {
	return {
		type: SHARE.SET_USER,
		user
	};
}
