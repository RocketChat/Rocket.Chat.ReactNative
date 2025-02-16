import type { Action } from 'redux';

import type { IUser } from '../definitions';
import * as types from './actionsTypes';

interface ICredentials {
	resume: string;
	user: string;
	password: string;
}

type ILoginRequest = Action & {
	credentials: any;
	logoutOnError?: boolean;
	isFromWebView?: boolean;
	registerCustomFields?: any;
}

type ILoginSuccess = Action & { user: Partial<IUser>; }

type ILoginFailure = Action & { err: Partial<IUser>; }

type ILogout = Action & { forcedByServer: boolean;
	message: string; }

type ISetUser = Action & { user: Partial<IUser>; }

type ISetServices = Action & { data: Record<string, string>; }

type ISetPreference = Action & { preference: Record<string, any>; }

type ISetLocalAuthenticated = Action & { isLocalAuthenticated: boolean; }

export type TActionsLogin = ILoginRequest &
	ILoginSuccess &
	ILoginFailure &
	ILogout &
	ISetUser &
	ISetServices &
	ISetPreference &
	ISetLocalAuthenticated;

export function loginRequest(
	credentials: Partial<ICredentials>,
	logoutOnError?: boolean,
	isFromWebView?: boolean,
	registerCustomFields?: any
): ILoginRequest {
	return {
		type: types.LOGIN.REQUEST,
		credentials,
		logoutOnError,
		isFromWebView,
		registerCustomFields
	};
}

export function loginSuccess(user: Partial<IUser>): ILoginSuccess {
	return {
		type: types.LOGIN.SUCCESS,
		user
	};
}

export function loginFailure(err: Record<string, any>): ILoginFailure {
	return {
		type: types.LOGIN.FAILURE,
		err
	};
}

export function logout(forcedByServer = false, message = ''): ILogout {
	return {
		type: types.LOGOUT,
		forcedByServer,
		message
	};
}

export function setUser(user: Partial<IUser>): ISetUser {
	return {
		type: types.USER.SET,
		user
	};
}

export function clearUser(): Action {
	return {
		type: types.USER.CLEAR
	};
}

export function setLoginServices(data: Record<string, any>): ISetServices {
	return {
		type: types.LOGIN.SET_SERVICES,
		data
	};
}

export function setPreference(preference: Record<string, any>): ISetPreference {
	return {
		type: types.LOGIN.SET_PREFERENCE,
		preference
	};
}

export function setLocalAuthenticated(isLocalAuthenticated: boolean): ISetLocalAuthenticated {
	return {
		type: types.LOGIN.SET_LOCAL_AUTHENTICATED,
		isLocalAuthenticated
	};
}

export function deleteAccount(): Action {
	return {
		type: types.DELETE_ACCOUNT
	};
}
