import { Action } from 'redux';

import { ISelectedUser } from '../reducers/selectedUsers';
import * as types from './actionsTypes';

type TUser = {
	user: ISelectedUser;
};

type TAction = Action & TUser;

interface ISetLoading extends Action {
	loading: boolean;
}

export type TActionSelectedUsers = TAction & ISetLoading;

export function addUser(user: ISelectedUser): TAction {
	return {
		type: types.SELECTED_USERS.ADD_USER,
		user
	};
}

export function removeUser(user: ISelectedUser): TAction {
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

export function setLoading(loading: boolean): ISetLoading {
	return {
		type: types.SELECTED_USERS.SET_LOADING,
		loading
	};
}
