import * as types from './actionsTypes';

export function setRoles(roles) {
	return {
		type: types.ROLES.SET,
		roles
	};
}
