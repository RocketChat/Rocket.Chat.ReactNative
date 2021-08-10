import {
	USER_RECORDING,
	USER_TYPING,
	USER_UPLOADING,
	CLEAR_ALL_USER_ACTIVITY
} from './actionsTypes';

function checkUserActionType(actionType) {
	switch (actionType) {
		case 'USER_TYPING':
			return USER_TYPING;
		case 'USER_RECORDING':
			return USER_RECORDING;
		case 'USER_UPLOADING':
			return USER_UPLOADING;
		default:
			return USER_TYPING;
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
