import * as types from './actionsTypes';

export function requestActiveUser(user) {
	return {
		type: types.ACTIVE_USERS.REQUEST,
		user
	};
}

export function setActiveUser(data) {
	return {
		type: types.ACTIVE_USERS.SET,
		data
	};
}
