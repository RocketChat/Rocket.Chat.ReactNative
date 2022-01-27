import { Action } from 'redux';

import { MESSAGES } from './actionsTypes';

type IMessage = Record<string, string>;

interface IReplyBroadcast extends Action {
	message: IMessage;
}

export function replyBroadcast(message: IMessage): IReplyBroadcast {
	return {
		type: MESSAGES.REPLY_BROADCAST,
		message
	};
}
