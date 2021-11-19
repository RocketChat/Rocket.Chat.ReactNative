import { USERS_ACTIVITY } from './actionsTypes';

export function addUserActivity(username, activity, roomId) {
	return {
		type: USERS_ACTIVITY.ADD,
		roomId,
		username,
		activity
	};
}

export function clearAllUserActivities(username, roomId) {
	return {
		type: USERS_ACTIVITY.CLEAR_ALL_USER_ACTIVITY,
		roomId,
		username
	};
}

export function removeAllRoomActivities() {
	return {
		type: USERS_ACTIVITY.REMOVE_ALL_ROOM_ACTIVITIES
	};
}
