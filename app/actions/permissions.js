import * as types from './actionsTypes';

export function setPermissions(permissions) {
	return {
		type: types.PERMISSIONS.SET,
		permissions
	};
}
