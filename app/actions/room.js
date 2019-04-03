import * as types from './actionsTypes';

export function leaveRoom(rid, t) {
	return {
		type: types.ROOM.LEAVE,
		rid,
		t
	};
}

export function eraseRoom(rid, t) {
	return {
		type: types.ROOM.ERASE,
		rid,
		t
	};
}

export function userTyping(rid, status = true) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		status
	};
}
