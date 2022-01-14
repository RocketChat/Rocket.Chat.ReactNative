import { Action } from 'redux';

import { IShareUser } from '../reducers/share';
import { SHARE } from './actionsTypes';

// TODO: NEED MORE ACCURATE TYPES
interface IShareSelectServer extends Action {
	server: any;
}

interface IShareSetSettings extends Action {
	settings: any;
}

interface IShareSetUser extends Action {
	user: IShareUser;
}

export type TActionShareUser = IShareSelectServer & IShareSetSettings & IShareSetUser;

export function shareSelectServer(server: any): IShareSelectServer {
	return {
		type: SHARE.SELECT_SERVER,
		server
	};
}

export function shareSetSettings(settings: any): IShareSetSettings {
	return {
		type: SHARE.SET_SETTINGS,
		settings
	};
}

export function shareSetUser(user: IShareUser): IShareSetUser {
	return {
		type: SHARE.SET_USER,
		user
	};
}
