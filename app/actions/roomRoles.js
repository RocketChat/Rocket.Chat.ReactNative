import * as types from './actionsTypes';

export function roomRolesRequest() {
	return {
		type: types.ROOM_ROLES.REQUEST
	};
}

export function roomRolesSuccess(roles) {
	return {
		type: types.ROOM_ROLES.SUCCESS,
		roles
	};
}

export function roomRolesFailure() {
	return {
		type: types.ROOM_ROLES.FAILURE
	};
}
