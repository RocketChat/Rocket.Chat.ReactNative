import * as types from './actionsTypes';

export function actionsShow(rid) {
	return {
		type: types.ROOM.ACTIONS_SHOW,
		rid
	};
}

export function actionsHide() {
	return {
		type: types.ROOM.ACTIONS_HIDE
	};
}

export function markAsUnreadRequest(rid) {
	return {
		type: types.ROOM.MARK_AS_UNREAD_REQUEST,
		rid
	};
}

export function markAsUnreadSuccess() {
	return {
		type: types.ROOM.MARK_AS_UNREAD_SUCCESS
	};
}

export function markAsUnreadFailure() {
	return {
		type: types.ROOM.MARK_AS_UNREAD_FAILURE
	};
}

export function toggleFavoriteRequest(rid) {
	return {
		type: types.ROOM.TOGGLE_FAVORITE_REQUEST,
		rid
	};
}

export function toggleFavoriteSuccess() {
	return {
		type: types.ROOM.TOGGLE_FAVORITE_SUCCESS
	};
}

export function toggleFavoriteFailure() {
	return {
		type: types.ROOM.TOGGLE_FAVORITE_FAILURE
	};
}

export function hideRoom(rid) {
	return {
		type: types.ROOM.HIDE,
		rid
	};
}

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
