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

export function deleteRequest(message) {
	return {
		type: types.MESSAGES.DELETE_REQUEST,
		message
	};
}

export function deleteSuccess() {
	return {
		type: types.MESSAGES.DELETE_SUCCESS
	};
}

export function deleteFailure() {
	return {
		type: types.MESSAGES.DELETE_FAILURE
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

export function starRequest(message) {
	return {
		type: types.MESSAGES.STAR_REQUEST,
		message
	};
}

export function starSuccess() {
	return {
		type: types.MESSAGES.STAR_SUCCESS
	};
}

export function starFailure() {
	return {
		type: types.MESSAGES.STAR_FAILURE
	};
}

export function permalinkRequest(message) {
	return {
		type: types.MESSAGES.PERMALINK_REQUEST,
		message
	};
}

export function permalinkSuccess(permalink) {
	return {
		type: types.MESSAGES.PERMALINK_SUCCESS,
		permalink
	};
}

export function permalinkFailure(err) {
	return {
		type: types.MESSAGES.PERMALINK_FAILURE,
		err
	};
}

export function togglePinRequest(message) {
	return {
		type: types.MESSAGES.TOGGLE_PIN_REQUEST,
		message
	};
}

export function togglePinSuccess() {
	return {
		type: types.MESSAGES.TOGGLE_PIN_SUCCESS
	};
}

export function togglePinFailure(err) {
	return {
		type: types.MESSAGES.TOGGLE_PIN_FAILURE,
		err
	};
}

export function setInput(message) {
	return {
		type: types.MESSAGES.SET_INPUT,
		message
	};
}
