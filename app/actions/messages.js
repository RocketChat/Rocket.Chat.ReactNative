import * as types from './actionsTypes';

export function actionsShow(actionMessage) {
	return {
		type: types.MESSAGES.ACTIONS_SHOW,
		actionMessage
	};
}

export function actionsHide() {
	return {
		type: types.MESSAGES.ACTIONS_HIDE
	};
}

export function errorActionsShow(actionMessage) {
	return {
		type: types.MESSAGES.ERROR_ACTIONS_SHOW,
		actionMessage
	};
}

export function errorActionsHide() {
	return {
		type: types.MESSAGES.ERROR_ACTIONS_HIDE
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

export function editCancel() {
	return {
		type: types.MESSAGES.EDIT_CANCEL
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

export function replyInit(message, mention) {
	return {
		type: types.MESSAGES.REPLY_INIT,
		message,
		mention
	};
}

export function replyCancel() {
	return {
		type: types.MESSAGES.REPLY_CANCEL
	};
}

export function toggleReactionPicker(message) {
	return {
		type: types.MESSAGES.TOGGLE_REACTION_PICKER,
		message
	};
}

export function replyBroadcast(message) {
	return {
		type: types.MESSAGES.REPLY_BROADCAST,
		message
	};
}
