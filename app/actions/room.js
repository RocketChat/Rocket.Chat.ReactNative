import { USER_TYPING, USER_UPLOADING, USER_RECORDING } from '../constants/userActivities';
import * as types from './actionsTypes';

export function subscribeRoom(rid) {
	return {
		type: types.ROOM.SUBSCRIBE,
		rid
	};
}

export function unsubscribeRoom(rid) {
	return {
		type: types.ROOM.UNSUBSCRIBE,
		rid
	};
}

export function leaveRoom(roomType, room, selected) {
	return {
		type: types.ROOM.LEAVE,
		room,
		roomType,
		selected
	};
}

export function deleteRoom(roomType, room, selected) {
	return {
		type: types.ROOM.DELETE,
		room,
		roomType,
		selected
	};
}

export function closeRoom(rid) {
	return {
		type: types.ROOM.CLOSE,
		rid
	};
}

export function forwardRoom(rid, transferData) {
	return {
		type: types.ROOM.FORWARD,
		transferData,
		rid
	};
}

export function removedRoom() {
	return {
		type: types.ROOM.REMOVED
	};
}

export function userTyping(rid, tmid, performing = false) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		activity: USER_TYPING,
		tmid,
		performing
	};
}

export function userUploading(rid, tmid, performing = false) {
	return {
		type: types.ROOM.USER_UPLOADING,
		rid,
		activity: USER_UPLOADING,
		tmid,
		performing
	};
}

export function userRecording(rid, tmid, performing = false) {
	return {
		type: types.ROOM.USER_RECORDING,
		rid,
		activity: USER_RECORDING,
		tmid,
		performing
	};
}

export function removeUserActivity(activity) {
	return {
		type: types.ROOM.REMOVE_USER_ACTIVITY,
		activity
	};
}
