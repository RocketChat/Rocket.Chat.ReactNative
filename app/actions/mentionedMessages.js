import * as types from './actionsTypes';

export function openMentionedMessages(rid) {
	return {
		type: types.MENTIONED_MESSAGES.OPEN,
		rid
	};
}

export function closeMentionedMessages() {
	return {
		type: types.MENTIONED_MESSAGES.CLOSE
	};
}

export function mentionedMessagesReceived(message) {
	return {
		type: types.MENTIONED_MESSAGES.MESSAGES_RECEIVED,
		message
	};
}
