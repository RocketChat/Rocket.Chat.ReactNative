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

export function userTyping(rid, status = true, options = {}) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		status,
		options
	};
}

export function userRecording(rid, status = true, options = {}) {
	return {
		type: types.ROOM.USER_RECORDING,
		rid,
		status,
		options
	};
}

export function userUploading(rid, status = true, options = {}) {
	return {
		type: types.ROOM.USER_UPLOADING,
		rid,
		status,
		options
	};
}
