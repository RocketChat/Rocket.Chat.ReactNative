import * as types from './actionsTypes';

export function setActiveUser(data) {
	return {
		type: types.ACTIVE_USERS.SET,
		data
	};
}
