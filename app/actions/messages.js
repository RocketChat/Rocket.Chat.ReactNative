import * as types from './actionsTypes';

export function replyBroadcast(message) {
	return {
		type: types.MESSAGES.REPLY_BROADCAST,
		message
	};
}
