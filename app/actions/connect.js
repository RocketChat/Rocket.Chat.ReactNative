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

export function disconnect(err) {
	return {
		type: types.METEOR.DISCONNECT,
		err
	};
}
