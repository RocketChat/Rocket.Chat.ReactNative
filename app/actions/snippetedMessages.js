import * as types from './actionsTypes';

export function openSnippetedMessages(rid, limit) {
	return {
		type: types.SNIPPETED_MESSAGES.OPEN,
		rid,
		limit
	};
}

export function readySnippetedMessages() {
	return {
		type: types.SNIPPETED_MESSAGES.READY
	};
}

export function closeSnippetedMessages() {
	return {
		type: types.SNIPPETED_MESSAGES.CLOSE
	};
}

export function snippetedMessagesReceived(messages) {
	return {
		type: types.SNIPPETED_MESSAGES.MESSAGES_RECEIVED,
		messages
	};
}
