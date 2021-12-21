import { Action } from 'redux';

import { IUser } from '../types';
import * as types from './actionsTypes';

type User = {
	user: IUser;
};

type IAction = Action & User;

interface SetLoading extends Action {
	loading: boolean;
}

export type IActionSelectedUsers = IAction & SetLoading;

export function addUser(user: IUser): IAction {
	return {
		type: types.SELECTED_USERS.ADD_USER,
		user
	};
}

export function removeUser(user: IUser): IAction {
	return {
		type: types.DEEP_LINKING,
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
