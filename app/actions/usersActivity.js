import { USERS_ACTIVITY } from './actionsTypes';

export function addUserActivity(username, activity, rid, tmid) {
	return {
		type: USERS_ACTIVITY.ADD,
		roomId: tmid || rid,
		username,
		activity
	};
}

export function clearUserActivity(username, rid, tmid) {
	return {
		type: USERS_ACTIVITY.CLEAR_USER_ACTIVITY,
		roomId: tmid || rid,
		username
	};
}

// We don't need the param tmid here, because we don't subscribe directly to threads, just to rid
export function removeRoomUsersActivity(rid) {
	return {
		type: USERS_ACTIVITY.REMOVE_ROOM_USERS_ACTIVITY,
		roomId: rid
	};
}
