import * as types from './actionsTypes';

export function setPermissions(permissions) {
	return {
		type: types.PERMISSIONS.SET,
		permissions
	};
}

export function updatePermissions(id, roles) {
	return {
		type: types.PERMISSIONS.UPDATE,
		payload: { id, roles }
	};
}
