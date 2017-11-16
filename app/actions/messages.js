import * as types from './actionsTypes';

export function messagesRequest({ rid }) {
	return {
		type: types.MESSAGES.REQUEST,
		rid
	};
}

export function messagesSuccess() {
	return {
		type: types.MESSAGES.SUCCESS
	};
}

export function messagesFailure(err) {
	return {
		type: types.MESSAGES.FAILURE,
		err
	};
}

export function editInit(message) {
	return {
		type: types.MESSAGES.EDIT_INIT,
		message
	};
}

export function editRequest(message) {
	return {
		type: types.MESSAGES.EDIT_REQUEST,
		message
	};
}

export function editSuccess() {
	return {
		type: types.MESSAGES.EDIT_SUCCESS
	};
}

export function editFailure() {
	return {
		type: types.MESSAGES.EDIT_FAILURE
	};
}
