import { Action } from 'redux';

import { DEEP_LINKING } from './actionsTypes';

interface IParams {
	path: string;
	rid: string;
	messageId: string;
	host: string;
	isCall: boolean;
	fullURL: string;
	type: string;
	token: string;
}

interface IDeepLinkingOpen extends Action {
	params: Partial<IParams>;
}

export function deepLinkingOpen(params: Partial<IParams>): IDeepLinkingOpen {
	return {
		type: DEEP_LINKING.OPEN,
		params
	};
}
