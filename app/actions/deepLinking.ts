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
	callId?: string;
	username?: string;
	voipAcceptFailed?: boolean;
}

interface IDeepLinkingOpen extends Action {
	params: Partial<IParams>;
	skipLoginConsent?: boolean;
}

export function deepLinkingOpen(params: Partial<IParams>, { skipLoginConsent = false } = {}): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN,
		params,
		skipLoginConsent
	};
}

export function deepLinkingClickCallPush(params: any): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN_VIDEO_CONF,
		params
	};
}
