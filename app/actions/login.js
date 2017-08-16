import * as types from './actionsTypes';

export function loginRequest(email, password) {
	return {
		type: types.LOGIN.REQUEST,
		email,
		password
	};
}

export function loginSuccess({ token, user }) {
	return {
		type: types.LOGIN.SUCCESS,
		token,
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
	return {
		type: types.LOGOUT
	};
}
