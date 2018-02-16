import * as types from './actionsTypes';

export function requestActiveUser(users) {
	return {
		type: types.ACTIVE_USERS.REQUEST,
		users
	};
}

export function setActiveUser(data) {
	return {
		type: types.ACTIVE_USERS.SET,
		data
	};
}
