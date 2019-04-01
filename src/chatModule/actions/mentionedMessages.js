import * as types from './actionsTypes';

export function openMentionedMessages(rid, limit) {
	return {
		type: types.MENTIONED_MESSAGES.OPEN,
		rid,
		limit
	};
}

export function readyMentionedMessages() {
	return {
		type: types.MENTIONED_MESSAGES.READY
	};
}


export function closeMentionedMessages() {
	return {
		type: types.MENTIONED_MESSAGES.CLOSE
	};
}

export function mentionedMessagesReceived(messages) {
	return {
		type: types.MENTIONED_MESSAGES.MESSAGES_RECEIVED,
		messages
	};
}
