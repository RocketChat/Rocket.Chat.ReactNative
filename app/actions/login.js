import * as types from './actionsTypes';

export function loginRequest(credentials) {
	return {
		type: types.LOGIN.REQUEST,
		...credentials
	};
}

export function loginSuccess({ token = {} }) {
	console.log('loginSuccess', token);
	return {
		type: types.LOGIN.SUCCESS,
		token
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
