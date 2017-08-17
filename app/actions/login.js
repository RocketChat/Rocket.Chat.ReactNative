import * as types from './actionsTypes';

export function loginRequest(credentials) {
	return {
		type: types.LOGIN.REQUEST,
		...credentials
	};
}

export function loginSuccess(user) {
	return {
		type: types.LOGIN.SUCCESS,
		user
	};
}

export function loginFailure(err) {
	return {
		type: types.LOGIN.FAILURE,
		err
	};
}

export function logout() {
	console.log('LOGOUT');
	return {
		type: types.LOGOUT
	};
}
