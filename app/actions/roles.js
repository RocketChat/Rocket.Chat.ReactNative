import * as types from './actionsTypes';

export function setRoles(roles) {
	return {
		type: types.ROLES.SET,
		roles
	};
}
export function updateRoles(id, desc) {
	return {
		type: types.ROLES.UPDATE,
		payload: { id, desc }
	};
}
export function removeRoles(id) {
	return {
		type: types.ROLES.REMOVE,
		payload: { id }
	};
}
