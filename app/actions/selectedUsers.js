import * as types from './actionsTypes';

export function addUser(user) {
	return {
		type: types.SELECTED_USERS.ADD_USER,
		user
	};
}

export function removeUser(user) {
	return {
		type: types.SELECTED_USERS.REMOVE_USER,
		user
	};
}

export function reset() {
	return {
		type: types.SELECTED_USERS.RESET
	};
}

export function setLoading(loading) {
	return {
		type: types.SELECTED_USERS.SET_LOADING,
		loading
	};
}
