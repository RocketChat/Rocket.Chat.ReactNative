import { Action } from 'redux';

import { MESSAGES } from './actionsTypes';
import { IMessage } from '../definitions';

interface IReplyBroadcast extends Action {
	message: IMessage;
}

export function replyBroadcast(message: IMessage): IReplyBroadcast {
	return {
		type: MESSAGES.REPLY_BROADCAST,
		message
	};
}
