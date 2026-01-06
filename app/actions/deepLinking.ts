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

interface IQuickActionParams {
	type: string;
	action: string;
}

interface IDeepLinkingOpen extends Action {
	params: Partial<IParams>;
}

interface IDeepLinkingQuickAction extends Action {
	params: Partial<IQuickActionParams>;
}

export function deepLinkingOpen(params: Partial<IParams>): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN,
		params
	};
}

export function deepLinkingQuickAction(params: Partial<IQuickActionParams>): IDeepLinkingQuickAction {
	console.log('call to deep linking quick actions');
	return {
		type: DEEP_LINKING.QUICK_ACTION,
		params
	};
}

export function deepLinkingClickCallPush(params: any): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN_VIDEO_CONF,
		params
	};
}
