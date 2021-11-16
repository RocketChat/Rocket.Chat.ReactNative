import { userTyping, userUploading, userRecording } from '../constants/userActivities';
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

export function typing(rid, options = {}, performing = false) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		activity: userTyping,
		options,
		performing
	};
}

export function uploading(rid, options = {}, performing = false) {
	return {
		type: types.ROOM.USER_UPLOADING,
		rid,
		activity: userUploading,
		options,
		performing
	};
}

export function recording(rid, options = {}, performing = false) {
	return {
		type: types.ROOM.USER_RECORDING,
		rid,
		activity: userRecording,
		options,
		performing
	};
}
