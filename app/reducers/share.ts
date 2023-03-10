import { TActionsShare } from '../actions/share';
import { SHARE } from '../actions/actionsTypes';

export interface IShareServer {
	server?: string;
	version?: string;
}

export type TShareSettings = Record<string, string | number | boolean>;

export interface IShareUser {
	id?: string;
	token?: string;
	username?: string;
	roles?: string[];
}

export interface IShare {
	user: IShareUser;
	server: IShareServer;
	settings: TShareSettings;
}

export const initialState: IShare = {
	user: {},
	server: {},
	settings: {}
};

export default function share(state = initialState, action: TActionsShare): IShare {
	switch (action.type) {
		case SHARE.SELECT_SERVER:
			return {
				...state,
				server: action.server
			};
		case SHARE.SET_USER:
			return {
				...state,
				user: action.user
			};
		case SHARE.SET_SETTINGS:
			return {
				...state,
				settings: action.settings
			};
		default:
			return state;
	}
}
