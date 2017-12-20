import * as types from './actionsTypes';

export function connectRequest() {
	return {
		type: types.METEOR.REQUEST
	};
}

export function connectSuccess() {
	return {
		type: types.METEOR.SUCCESS
	};
}

export function connectFailure(err) {
	return {
		type: types.METEOR.FAILURE,
		err
	};
}

export function disconnect(err) {
	return {
		type: types.METEOR.DISCONNECT,
		err
	};
}
export function disconnect_by_user() {
	return {
		type: types.METEOR.DISCONNECT_BY_USER
	};
}
