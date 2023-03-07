import { Action } from 'redux';

import { VIDEO_CONF } from './actionsTypes';

export interface IVideoConfGenericAction extends Action {
	data: any;
}

export type TActionUserTyping = IVideoConfGenericAction & Action;

export function handleVideoConfIncomingWebsocketMessages(data: any): IVideoConfGenericAction {
	return {
		type: VIDEO_CONF.HANDLE_INCOMING_WEBSOCKET_MESSAGES,
		data
	};
}
