import * as types from './actionsTypes';

export function setRoles(data) {
	return {
		type: types.ROLES.SET,
		data
	};
}
