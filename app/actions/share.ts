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

interface IShareSetParams extends Action {
	params: any;
}

export type TActionsShare = IShareSelectServer & IShareSetSettings & IShareSetUser & IShareSetParams;

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

export function shareSetParams(params: any): IShareSetParams {
	return {
		type: SHARE.SET_PARAMS,
		params
	};
}
