import * as types from './actionsTypes';

export function leaveRoom(rid, t) {
	return {
		type: types.ROOM.LEAVE,
		rid,
		t
	};
}

export function deleteRoomInit(rid, t) {
	return {
		type: types.ROOM.DELETE_INIT,
		rid,
		t
	};
}

export function deleteRoomFinish() {
	return {
		type: types.ROOM.DELETE_FINISH
	};
}

export function userTyping(rid, status = true) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		status
	};
}
