import { ACTIVITIES } from './actionsTypes';

export function addUserActivity(username, actionType, roomId) {
	const activity = actionType.split('_')[1].toLowerCase();

	return {
		type: ACTIVITIES.ADD,
		roomId,
		username,
		activity
	};
}

export function clearAllUserActivities(username, roomId) {
	return {
		type: ACTIVITIES.CLEAR_ALL_USER_ACTIVITY,
		roomId,
		username
	};
}

export function removeAllRoomActivities() {
	return {
		type: ACTIVITIES.REMOVE_ALL_ROOM_ACTIVITIES
	};
}
