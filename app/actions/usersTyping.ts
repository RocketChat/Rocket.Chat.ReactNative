import { Action } from 'redux';

import { USERS_TYPING } from './actionsTypes';

export interface IUsersTypingGenericAction extends Action {
	username: string;
}

export type TActionUserTyping = IUsersTypingGenericAction & Action;

export function addUserTyping(username: string): IUsersTypingGenericAction {
	return {
		type: USERS_TYPING.ADD,
		username
	};
}

export function removeUserTyping(username: string): IUsersTypingGenericAction {
	return {
		type: USERS_TYPING.REMOVE,
		username
	};
}

export function clearUserTyping(): Action {
	return {
		type: USERS_TYPING.CLEAR
	};
}
