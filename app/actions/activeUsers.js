import * as types from './actionsTypes';


export function setActiveUser(user) {
	return {
		type: types.ACTIVE_USERS.SET,
		user
	};
}
