import { Action } from 'redux';

import { IShareServer, IShareUser, TShareSettings } from '../reducers/share';
import { SHARE } from './actionsTypes';

interface IShareSelectServer extends Action {
	server: IShareServer;
}

interface IShareSetSettings extends Action {
	settings: TShareSettings;
}

interface IShareSetUser extends Action {
	user: IShareUser;
}

export type TActionsShare = IShareSelectServer & IShareSetSettings & IShareSetUser;

export function shareSelectServer(server: IShareServer): IShareSelectServer {
	return {
		type: SHARE.SELECT_SERVER,
		server
	};
}

export function shareSetSettings(settings: TShareSettings): IShareSetSettings {
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
