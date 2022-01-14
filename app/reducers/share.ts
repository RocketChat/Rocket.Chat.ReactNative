import { TActionShare } from '../actions/share';
import { SHARE } from '../actions/actionsTypes';

export interface IShareUser {
	id: string;
	token: string;
	username: string;
	roles: string[];
}

interface IShare {
	user: IShareUser | {};
	// TODO: NEED MORE ACCURATE TYPES
	server: Record<string, string> | {};
	settings: Record<string, string> | {};
}

export const initialState: IShare = {
	user: {},
	server: {},
	settings: {}
};

export default function share(state = initialState, action: TActionShare): IShare {
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
