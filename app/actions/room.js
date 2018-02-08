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

export function closeRoom() {
	return {
		type: types.ROOM.CLOSE
	};
}

export function userTyping(status = true) {
	return {
		type: types.ROOM.USER_TYPING,
		status
	};
}

export function roomMessageReceived(message) {
	return {
		type: types.ROOM.MESSAGE_RECEIVED,
		message
	};
}

export function setLastOpen(date = new Date()) {
	return {
		type: types.ROOM.SET_LAST_OPEN,
		date
	};
}

export function layoutAnimation() {
	return {
		type: types.ROOM.LAYOUT_ANIMATION
	};
}
