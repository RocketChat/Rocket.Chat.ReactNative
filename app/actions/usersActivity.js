import { USERS_TYPING, USERS_RECORDING, USERS_UPLOADING } from './actionsTypes';

function checkUserActionType(actionType) {
	let type;
	if (actionType === 'USER_TYPING') {
		type = USERS_TYPING;
	} else if (actionType === 'USER_RECORDING') {
		type = USERS_RECORDING;
	} else {
		type = USERS_UPLOADING;
	}
	return type;
}

export function addUserActivity(username, actionType, roomId) {
	const action = checkUserActionType(actionType);
	return {
		type: action.ADD,
		username,
		roomId
	};
}

export function removeUserActivity(username, actionType, roomId) {
	const action = checkUserActionType(actionType);

	return {
		type: action.REMOVE,
		username,
		roomId
	};
}

export function clearUserActivity(actionType) {
	const action = checkUserActionType(actionType);
	return {
		type: action.CLEAR
	};
}
