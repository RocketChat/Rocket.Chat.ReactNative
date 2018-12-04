import * as types from './actionsTypes';

export function loginRequest(credentials) {
	return {
		type: types.LOGIN.REQUEST,
		credentials
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
	return {
		type: types.LOGOUT
	};
}

export function setUser(user) {
	return {
		type: types.USER.SET,
		user
	};
}

export function setLoginServices(data) {
	return {
		type: types.LOGIN.SET_SERVICES,
		data
	};
}

export function setPreference(preference) {
	return {
		type: types.LOGIN.SET_PREFERENCE,
		preference
	};
}
