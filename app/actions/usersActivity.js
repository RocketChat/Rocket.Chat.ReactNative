import { USER_RECORDING, USER_TYPING, USER_UPLOADING, CLEAR_ALL_USER_ACTIVITY, REMOVE_ALL_ROOM_ACTIVITIES } from './actionsTypes';

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
		roomId,
		username,
		activity
	};
}

export function clearAllUserActivities(username, roomId) {
	return {
		type: CLEAR_ALL_USER_ACTIVITY,
		roomId,
		username
	};
}

export function removeAllRoomActivities() {
	return {
		type: REMOVE_ALL_ROOM_ACTIVITIES
	};
}
