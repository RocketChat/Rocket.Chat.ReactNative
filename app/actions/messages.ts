import type { Action } from 'redux';

import { MESSAGES } from './actionsTypes';
import type { IMessage } from '../definitions';

type IReplyBroadcast = Action & { message: IMessage; }

export function replyBroadcast(message: IMessage): IReplyBroadcast {
	return {
		type: MESSAGES.REPLY_BROADCAST,
		message
	};
}
