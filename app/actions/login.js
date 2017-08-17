import * as types from './actionsTypes';

export function loginRequest(credentials) {
	return {
		type: types.LOGIN.REQUEST,
		...credentials
	};
}

export function loginSuccess(/* { token, user } */) {
	return {
		type: types.LOGIN.SUCCESS
		// token,
		// user
	};
}

export function loginFailure(err) {
	return {
		type: types.LOGIN.FAILURE,
		err
	};
}

export function logout() {
	return {
		type: types.LOGOUT
	};
}
