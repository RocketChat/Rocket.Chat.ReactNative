import { Action } from 'redux';

import { ISelectedUser } from '../reducers/selectedUsers';
import * as types from './actionsTypes';

type User = {
	user: ISelectedUser;
};

type IAction = Action & User;

interface SetLoading extends Action {
	loading: boolean;
}

export type IActionSelectedUsers = IAction & SetLoading;

export function addUser(user: ISelectedUser): IAction {
	return {
		type: types.SELECTED_USERS.ADD_USER,
		user
	};
}

export function removeUser(user: ISelectedUser): IAction {
	return {
		type: types.SELECTED_USERS.REMOVE_USER,
		user
	};
}

export function reset(): Action {
	return {
		type: types.SELECTED_USERS.RESET
	};
}

export function setLoading(loading: boolean): SetLoading {
	return {
		type: types.SELECTED_USERS.SET_LOADING,
		loading
	};
}
