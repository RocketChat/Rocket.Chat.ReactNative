import * as types from './actionsTypes';

export function createChannelRequest(data) {
	return {
		type: types.CREATE_CHANNEL.REQUEST,
		data
	};
}

export function createChannelSuccess(data) {
	return {
		type: types.CREATE_CHANNEL.SUCCESS,
		data
	};
}

export function createChannelFailure(err) {
	return {
		type: types.CREATE_CHANNEL.FAILURE,
		err
	};
}

export function createChannelRequestUsers(data) {
	return {
		type: types.CREATE_CHANNEL.REQUEST_USERS,
		data
	};
}

export function createChannelSetUsers(data) {
	return {
		type: types.CREATE_CHANNEL.SET_USERS,
		data
	};
}

export function createChannelSuccessUsers(data) {
	return {
		type: types.CREATE_CHANNEL.SUCCESS_USERS,
		data
	};
}

export function createChannelFailureUsers(err) {
	return {
		type: types.CREATE_CHANNEL.FAILURE_USERS,
		err
	};
}

export function addUser(user) {
	return {
		type: types.CREATE_CHANNEL.ADD_USER,
		user
	};
}

export function removeUser(user) {
	return {
		type: types.CREATE_CHANNEL.REMOVE_USER,
		user
	};
}

export function reset() {
	return {
		type: types.CREATE_CHANNEL.RESET
	};
}
