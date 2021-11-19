import { USERS_ACTIVITY } from './actionsTypes';

export function addUserActivity(username, activity, rid, tmid) {
	return {
		type: USERS_ACTIVITY.ADD,
		roomId: tmid || rid,
		username,
		activity
	};
}

export function clearUserActivity(username, roomId) {
	return {
		type: USERS_ACTIVITY.CLEAR_USER_ACTIVITY,
		roomId,
		username
	};
}

export function removeRoomUsersActivity() {
	return {
		type: USERS_ACTIVITY.REMOVE_ROOM_USERS_ACTIVITY
	};
}
