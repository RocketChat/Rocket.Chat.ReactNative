import * as types from './actionsTypes';


export function removeUserTyping(username) {
	return {
		type: types.ROOM.REMOVE_USER_TYPING,
		username
	};
}

export function someoneTyping(data) {
	return {
		type: types.ROOM.SOMEONE_TYPING,
		...data
	};
}

export function addUserTyping(username) {
	return {
		type: types.ROOM.ADD_USER_TYPING,
		username
	};
}

export function openRoom(room) {
	return {
		type: types.ROOM.OPEN,
		room
	};
}

export function userTyping(status = true) {
	return {
		type: types.ROOM.USER_TYPING,
		status
	};
}
