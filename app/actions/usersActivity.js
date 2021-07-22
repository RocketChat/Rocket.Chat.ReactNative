import {
	USER_RECORDING,
	USER_TYPING,
	USER_UPLOADING,
	CLEAR_ALL_USER_ACTIVITY
} from './actionsTypes';

function checkUserActionType(actionType) {
	if (actionType === 'USER_TYPING') {
		return USER_TYPING;
	} else if (actionType === 'USER_RECORDING') {
		return USER_RECORDING;
	} else {
		return USER_UPLOADING;
	}
}

export function addUserActivity(username, actionType, roomId) {
	const action = checkUserActionType(actionType);
	const activity = actionType.split('_')[1].toLowerCase();

	return {
		type: action.ADD,
		activity,
		username,
		roomId
	};
}

export function removeUserActivity(username, actionType, roomId) {
	const action = checkUserActionType(actionType);
	const activity = actionType.split('_')[1].toLowerCase();

	return {
		type: action.REMOVE,
		activity,
		username,
		roomId
	};
}

export function clearAllUserActivities() {
	return {
		type: CLEAR_ALL_USER_ACTIVITY
	};
}
