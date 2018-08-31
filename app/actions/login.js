import * as types from './actionsTypes';

export function loginSubmit(credentials) {
	return {
		type: types.LOGIN.SUBMIT,
		credentials
	};
}
export function loginRequest(credentials) {
	return {
		type: types.LOGIN.REQUEST,
		credentials
	};
}

export function registerSubmit(credentials) {
	return {
		type: types.LOGIN.REGISTER_SUBMIT,
		credentials
	};
}
export function registerRequest(credentials) {
	return {
		type: types.LOGIN.REGISTER_REQUEST,
		credentials
	};
}
export function registerSuccess(credentials) {
	return {
		type: types.LOGIN.REGISTER_SUCCESS,
		credentials
	};
}
export function registerIncomplete() {
	return {
		type: types.LOGIN.REGISTER_INCOMPLETE
	};
}

export function setUsernameSubmit(credentials) {
	return {
		type: types.LOGIN.SET_USERNAME_SUBMIT,
		credentials
	};
}

export function setUsernameRequest(credentials) {
	return {
		type: types.LOGIN.SET_USERNAME_REQUEST,
		credentials
	};
}

export function setUsernameSuccess() {
	return {
		type: types.LOGIN.SET_USERNAME_SUCCESS
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

export function setToken(user = {}) {
	return {
		type: types.LOGIN.SET_TOKEN,
		...user
	};
}

export function restoreToken(token) {
	return {
		type: types.LOGIN.RESTORE_TOKEN,
		token
	};
}

export function logout() {
	return {
		type: types.LOGOUT
	};
}

export function forgotPasswordInit() {
	return {
		type: types.FORGOT_PASSWORD.INIT
	};
}

export function forgotPasswordRequest(email) {
	return {
		type: types.FORGOT_PASSWORD.REQUEST,
		email
	};
}

export function forgotPasswordSuccess() {
	return {
		type: types.FORGOT_PASSWORD.SUCCESS
	};
}

export function forgotPasswordFailure(err) {
	return {
		type: types.FORGOT_PASSWORD.FAILURE,
		err
	};
}

export function setUser(action) {
	return {
		// do not change this params order
		// since we use spread operator, sometimes `type` is overriden
		...action,
		type: types.USER.SET
	};
}

export function open() {
	return {
		type: types.LOGIN.OPEN
	};
}

export function close() {
	return {
		type: types.LOGIN.CLOSE
	};
}

export function setLoginServices(data) {
	return {
		type: types.LOGIN.SET_SERVICES,
		data
	};
}

export function removeLoginServices() {
	return {
		type: types.LOGIN.REMOVE_SERVICES
	};
}

export function setPreference(preference) {
	return {
		type: types.LOGIN.SET_PREFERENCE,
		preference
	};
}
