import { USERS_TYPING } from './actionsTypes';

export function addUserTyping(username) {
	return {
		type: USERS_TYPING.ADD,
		username
	};
}

export function removeUserTyping(username) {
	return {
		type: USERS_TYPING.REMOVE,
		username
	};
}

export function clearUserTyping() {
	return {
		type: USERS_TYPING.CLEAR
	};
}
