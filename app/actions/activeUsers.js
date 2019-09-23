import { SET_ACTIVE_USERS } from './actionsTypes';

export function setActiveUsers(activeUsers) {
	return {
		type: SET_ACTIVE_USERS,
		activeUsers
	};
}
