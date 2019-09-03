import * as types from './actionsTypes';

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

export function toggleStarRequest(message) {
	return {
		type: types.MESSAGES.TOGGLE_STAR_REQUEST,
		message
	};
}

export function toggleStarSuccess() {
	return {
		type: types.MESSAGES.TOGGLE_STAR_SUCCESS
	};
}

export function toggleStarFailure() {
	return {
		type: types.MESSAGES.TOGGLE_STAR_FAILURE
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

export function replyBroadcast(message) {
	return {
		type: types.MESSAGES.REPLY_BROADCAST,
		message
	};
}
