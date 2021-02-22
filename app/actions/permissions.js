import * as types from './actionsTypes';

export function setPermissions(permissions) {
	return {
		type: types.PERMISSIONS.SET,
		permissions
	};
}

export function clearPermissions() {
	return {
		type: types.PERMISSIONS.CLEAR
	};
}
