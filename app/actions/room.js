import * as types from './actionsTypes';

export function leaveRoom(rid, t) {
	return {
		type: types.ROOM.LEAVE,
		rid,
		t
	};
}

export function deleteRoom(rid, t) {
	return {
		type: types.ROOM.DELETE,
		rid,
		t
	};
}

export function removedRoom() {
	return {
		type: types.ROOM.REMOVED
	};
}

export function userTyping(rid, status = true) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		status
	};
}
