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
		user,
		token: user.token
	};
}

export function loginFailure(err) {
	return {
		type: types.LOGIN.FAILURE,
		err
	};
}

export function setToken(token) {
	return {
		type: types.LOGIN.SET_TOKEN,
		token
	};
}

export function logout() {
	return {
		type: types.LOGOUT
	};
}
