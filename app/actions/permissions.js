import * as types from './actionsTypes';

export function permissionsRequest() {
	return {
		type: types.PERMISSIONS.REQUEST
	};
}

export function permissionsSuccess(permissions) {
	return {
		type: types.PERMISSIONS.SUCCESS,
		permissions
	};
}

export function permissionsFailure(err) {
	return {
		type: types.PERMISSIONS.FAILURE,
		err
	};
}
