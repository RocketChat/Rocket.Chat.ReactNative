import * as types from '../actions/actionsTypes';
import { TActionsLogin } from '../actions/login';
import { IUser, TUserStatus } from '../definitions';

export interface IUserLogin {
	id: string;
	token: string;
	username: string;
	name: string;
	language?: string;
	status: TUserStatus;
	statusText: string;
	roles: string[];
	avatarETag?: string;
	isFromWebView: boolean;
	showMessageInMainThread: boolean;
	enableMessageParserEarlyAdoption: boolean;
	emails: Record<string, any>[];
	customFields: Record<string, string>;
	settings?: Record<string, string>;
}

export interface ILogin {
	user: Partial<IUser>;
	isLocalAuthenticated: boolean;
	isAuthenticated: boolean;
	isFetching: boolean;
	error: Record<string, any>;
	services: Record<string, any>;
	failure: boolean;
}

export const initialState: ILogin = {
	isLocalAuthenticated: true,
	isAuthenticated: false,
	isFetching: false,
	user: {},
	error: {},
	services: {},
	failure: false
};

export default function login(state = initialState, action: TActionsLogin): ILogin {
	switch (action.type) {
		case types.APP.INIT:
			return initialState;
		case types.LOGIN.REQUEST:
			return {
				...state,
				isFetching: true,
				isAuthenticated: false,
				failure: false,
				error: {}
			};
		case types.LOGIN.SUCCESS:
			return {
				...state,
				isFetching: false,
				isAuthenticated: true,
				user: action.user,
				failure: false,
				error: {}
			};
		case types.LOGIN.FAILURE:
			return {
				...state,
				isFetching: false,
				isAuthenticated: false,
				failure: true,
				error: action.err
			};
		case types.LOGOUT:
			return initialState;
		case types.USER.SET:
			return {
				...state,
				user: {
					...state.user,
					...action.user
				}
			};
		case types.USER.CLEAR:
			return {
				...state,
				user: {},
				isAuthenticated: false,
				isLocalAuthenticated: false
			};
		case types.LOGIN.SET_SERVICES:
			return {
				...state,
				services: {
					...action.data
				}
			};
		case types.LOGIN.SET_PREFERENCE:
			return {
				...state,
				user: {
					...state.user,
					settings: state.user?.settings
						? {
								...state.user?.settings,
								preferences: state.user?.settings?.preferences
									? { ...state.user.settings.preferences, ...action.preference }
									: { ...action.preference }
						  }
						: { profile: {}, preferences: {} }
				}
			};
		case types.LOGIN.SET_LOCAL_AUTHENTICATED:
			return {
				...state,
				isLocalAuthenticated: action.isLocalAuthenticated
			};
		case types.DELETE_ACCOUNT:
			return {
				...state,
				isLocalAuthenticated: false
			};
		default:
			return state;
	}
}
