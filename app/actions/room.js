import * as types from './actionsTypes';


export function removeUserTyping(username) {
	return {
		type: types.ROOM.REMOVE_USER_TYPING,
		username
	};
}

export function typing(data) {
	return {
		type: types.ROOM.USER_TYPING,
		...data
	};
}
export function addUserTyping(username) {
	return {
		type: types.ROOM.ADD_USER_TYPING,
		username
	};
}
