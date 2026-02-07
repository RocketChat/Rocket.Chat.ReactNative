import { type Action } from 'redux';

import { DEEP_LINKING } from './actionsTypes';

interface IParams {
	path: string;
	rid: string;
	messageId: string;
	host: string;
	fullURL: string;
	type: string;
	token: string;
}

interface IDeepLinkingOpen extends Action {
	params: Partial<IParams>;
}

interface IVoipCallParams {
	callId: string;
	callUUID: string;
	host: string;
}

interface IVoipCallOpen extends Action {
	params: IVoipCallParams;
}

export function deepLinkingOpen(params: Partial<IParams>): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN,
		params
	};
}

export function deepLinkingClickCallPush(params: any): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN_VIDEO_CONF,
		params
	};
}

/**
 * Action to handle VoIP call from push notification.
 * Triggers server switching if needed and processes the incoming call.
 */
export function voipCallOpen(params: IVoipCallParams): IVoipCallOpen {
	return {
		type: DEEP_LINKING.VOIP_CALL,
		params
	};
}
